import { create } from "zustand"
import { persist } from "zustand/middleware"
import { jwtDecode } from "jwt-decode"
import type { User, AuthState, LoginResponse, RefreshTokenResponse, RequiredOptions } from "@/lib/types/auth.types"
import { encryptRsa } from "@/lib/utils/encrypt"
import { serviceLoginManagerUserAuth, serviceRefreshToken } from "@/lib/services/login/login"
import { createRefreshTokenWorker, type RefreshTokenWorker } from "@/lib/workers/refresh-token-worker"
import { getLoginUrl } from "@/lib/utils/company-identifier"

const STORAGE_KEY = "mv-auth"
/** Motivo del fin de sesión: lo lee el login para explicarle al usuario qué pasó */
export const SESSION_END_REASON_KEY = "mv-session-end-reason"

/** Reintentos ante fallos NO de autenticación (red, 5xx, timeout) antes de rendirse */
const REFRESH_RETRY_DELAYS_MS = [2000, 5000, 15000]
/**
 * El backend exige refrescar con el access token TODAVÍA vigente, así que se
 * renueva a mitad de su vida (acotado): esperar al último minuto significa que
 * cualquier pestaña en segundo plano o equipo suspendido pierde la sesión.
 */
const MIN_REFRESH_MARGIN_MS = 60 * 1000
const MAX_REFRESH_MARGIN_MS = 15 * 60 * 1000
const DEFAULT_REFRESH_MARGIN_MS = 5 * 60 * 1000
/** Espera antes de volver a intentar cuando se agotaron los reintentos (evita loop apretado) */
const REFRESH_COOLDOWN_MS = 30000
/** Techo de vida de la cookie httpOnly */
const COOKIE_MAX_AGE_CAP = 60 * 60 * 24 * 30
const COOKIE_MAX_AGE_FALLBACK = 60 * 60 * 24

/**
 * - "ok": tokens renovados
 * - "invalid": el backend rechazó el refresh token → la sesión terminó de verdad
 * - "transient": red caída, 5xx, timeout… → hay que reintentar, NO cerrar sesión
 */
export type RefreshOutcome = "ok" | "invalid" | "transient"

/** Chequeo de respaldo en el hilo principal por si el Web Worker no arranca */
const FALLBACK_CHECK_INTERVAL_MS = 30 * 1000

/**
 * Desfase de reloj por debajo del cual no corregimos nada: la latencia de red y
 * el redondeo de `iat` a segundos siempre dan unos segundos de diferencia.
 */
const CLOCK_SKEW_THRESHOLD_MS = 60 * 1000

let workerInstance: RefreshTokenWorker | null = null
let refreshPromise: Promise<RefreshOutcome> | null = null
let visibilityHandler: (() => void) | null = null
let storageHandler: ((event: StorageEvent) => void) | null = null
let cooldownTimer: ReturnType<typeof setTimeout> | null = null
let fallbackInterval: ReturnType<typeof setInterval> | null = null

/**
 * Convierte la expiración que manda el backend a timestamp absoluto.
 * Acepta "7d" / "12h" / "30m" / "3600" / número (seg o ms) / fecha ISO.
 * Devuelve null si no se puede determinar: NUNCA 0, porque 0 significaría
 * "ya expiró" y cerraría la sesión sin motivo.
 */
function parseExpiresIn(expiresIn: unknown, fromTimestamp?: number): number | null {
  if (expiresIn === null || expiresIn === undefined) return null

  const now = fromTimestamp || Date.now()

  if (typeof expiresIn === "number") {
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) return null
    // Valores muy grandes ya vienen en milisegundos
    return now + (expiresIn > 1e10 ? expiresIn : expiresIn * 1000)
  }

  const raw = String(expiresIn).trim()
  if (!raw) return null

  const match = raw.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i)
  if (!match) {
    // Último recurso: puede venir una fecha ISO
    const asDate = Date.parse(raw)
    return Number.isNaN(asDate) ? null : asDate
  }

  const value = parseFloat(match[1])
  if (!Number.isFinite(value) || value <= 0) return null

  const unitFactors: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }
  // Sin unidad se asume segundos (comportamiento histórico del backend)
  const factor = unitFactors[(match[2] || "s").toLowerCase()] ?? 1000

  return now + value * factor
}

/**
 * Extrae exp del JWT
 */
function getTokenExpiration(token: string): number {
  try {
    const decoded: any = jwtDecode(token)
    return decoded.exp * 1000
  } catch {
    return 0
  }
}

/**
 * Vencimiento del access token. Preferimos el `exp` del JWT y, si no se puede
 * decodificar, usamos la fecha que manda el backend: quedarnos en 0 significaría
 * que nadie programa la renovación y la sesión se muere en silencio.
 */
function resolveAccessTokenExpiresAt(token: string, expiresIn?: string | null): number {
  return getTokenExpiration(token) || (parseExpiresIn(expiresIn) ?? 0)
}

/**
 * Desfase entre el reloj del equipo y el del servidor, medido con el `iat` del
 * JWT (que es el "ahora" del backend en el momento de emitirlo).
 * Positivo = el equipo va adelantado. Devuelve null si no se puede medir.
 */
function measureClockSkew(token: string): number | null {
  try {
    const decoded: any = jwtDecode(token)
    if (typeof decoded?.iat !== "number") return null
    const skew = Date.now() - decoded.iat * 1000
    return Math.abs(skew) >= CLOCK_SKEW_THRESHOLD_MS ? skew : 0
  } catch {
    return null
  }
}

/**
 * "Ahora" según el reloj del servidor. Todas las expiraciones llegan como fecha
 * absoluta del backend, así que compararlas contra `Date.now()` a secas deja la
 * sesión a merced del reloj del equipo del usuario.
 */
function serverNow(skewMs: number): number {
  return Date.now() - (skewMs || 0)
}

/**
 * Momento en el que hay que renovar: mitad de la vida del access token,
 * con un mínimo de 1 min y un máximo de 15 min de anticipación.
 */
function computeRefreshAt(token: string, accessTokenExpiresAt: number, skewMs = 0): number {
  if (!accessTokenExpiresAt) return 0

  let issuedAt = 0
  try {
    const decoded: any = jwtDecode(token)
    issuedAt = typeof decoded?.iat === "number" ? decoded.iat * 1000 : 0
  } catch {
    issuedAt = 0
  }

  // Sin `iat` usable, la vida restante es la mejor aproximación disponible a la
  // vida total (en login y en refresh el token acaba de emitirse).
  const lifetime = issuedAt > 0 ? accessTokenExpiresAt - issuedAt : accessTokenExpiresAt - serverNow(skewMs)
  const margin =
    lifetime > 0
      ? Math.min(Math.max(lifetime / 2, MIN_REFRESH_MARGIN_MS), MAX_REFRESH_MARGIN_MS)
      : DEFAULT_REFRESH_MARGIN_MS

  return accessTokenExpiresAt - margin
}

/**
 * Decodifica JWT y extrae User
 */
function parseRequiredOptions(raw: unknown): RequiredOptions {
  const options: string[] = Array.isArray(raw) ? raw : []
  return {
    credentialsSignature: options.includes("credentialsSignature"),
    professionalInformation: options.includes("professionalInformation"),
  }
}

function decodeUserFromToken(accessToken: string): User {
  const decoded: any = jwtDecode(accessToken)

  const role = decoded.role || decoded.roleName || decoded.Role || decoded.RoleName || 'Unknown'

  return {
    id: decoded.Id,
    email: decoded.username,
    name: decoded.fullName,
    role,
    permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
    memberUserTypes: Array.isArray(decoded.memberUserTypes) ? decoded.memberUserTypes : [],
    requiredOptions: parseRequiredOptions(decoded.requiredOptions),
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
  }
}

/**
 * La cookie httpOnly debe vivir al menos lo que vive el refresh token; si no,
 * el layout del servidor manda a /login-error aunque la sesión siga siendo válida.
 */
function cookieMaxAgeFor(refreshTokenExpiresAt: number, skewMs = 0): number {
  if (!refreshTokenExpiresAt) return COOKIE_MAX_AGE_FALLBACK
  const seconds = Math.floor((refreshTokenExpiresAt - serverNow(skewMs)) / 1000)
  if (!Number.isFinite(seconds) || seconds <= 0) return COOKIE_MAX_AGE_FALLBACK
  return Math.min(Math.max(seconds, COOKIE_MAX_AGE_FALLBACK), COOKIE_MAX_AGE_CAP)
}

/**
 * Actualiza la cookie del servidor
 */
async function updateServerCookie(accessToken: string, maxAge?: number) {
  try {
    await fetch("/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: accessToken, maxAge }),
    })
  } catch (error) {
    console.error("[AuthStore] Error updating server cookie:", error)
  }
}

type PersistedTokens = {
  accessToken: string | null
  accessTokenExpiresAt: number
  refreshToken: string | null
  refreshTokenExpiresAt: number
}

/**
 * Lee los tokens que hay en localStorage. Sirve para detectar que OTRA pestaña
 * ya rotó el refresh token: si refrescáramos con el token viejo el backend lo
 * invalidaría y cerraría la sesión en todas las pestañas.
 */
function readPersistedTokens(): PersistedTokens | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const state = parsed?.state
    if (!state?.accessToken) return null
    return {
      accessToken: state.accessToken ?? null,
      accessTokenExpiresAt: state.accessTokenExpiresAt ?? 0,
      refreshToken: state.refreshToken ?? null,
      refreshTokenExpiresAt: state.refreshTokenExpiresAt ?? 0,
    }
  } catch {
    return null
  }
}

function markSessionEndReason(reason: "expired") {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(SESSION_END_REASON_KEY, reason)
  } catch {
    /* sessionStorage puede no estar disponible */
  }
}

// ============================================
// STORE INTERFACE
// ============================================

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string, companyId: string, companyName: string, companyLogo: string) => Promise<boolean>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
  /** Igual que refresh() pero indicando por qué falló, para no cerrar sesión ante fallos transitorios */
  refreshSession: () => Promise<RefreshOutcome>
  endSession: () => void

  // Worker control
  initWorker: () => void
  stopWorker: () => void
  clearWorker: () => void

  // Internal
  setHydrated: (hydrated: boolean) => void
}

// ============================================
// ZUSTAND STORE
// ============================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      /**
       * Un intento de refresh. No cierra sesión: sólo reporta qué pasó.
       * - "ok": tokens renovados
       * - "invalid": el backend rechazó el refresh token (401/403) → sesión terminada de verdad
       * - "transient": red caída, 5xx, timeout… → hay que reintentar, NO cerrar sesión
       */
      const attemptRefresh = async (): Promise<RefreshOutcome> => {
        const state = get()
        if (!state.refreshToken) return "invalid"

        // ¿Otra pestaña ya refrescó? Adoptamos sus tokens en vez de pedir otros.
        const persisted = readPersistedTokens()
        if (
          persisted?.accessToken &&
          persisted.accessToken !== state.accessToken &&
          persisted.accessTokenExpiresAt > serverNow(state.clockSkewMs) + 30000
        ) {
          try {
            set({
              user: decodeUserFromToken(persisted.accessToken),
              accessToken: persisted.accessToken,
              accessTokenExpiresAt: persisted.accessTokenExpiresAt,
              accessTokenRefreshAt: computeRefreshAt(
                persisted.accessToken,
                persisted.accessTokenExpiresAt,
                state.clockSkewMs,
              ),
              refreshToken: persisted.refreshToken,
              refreshTokenExpiresAt: persisted.refreshTokenExpiresAt,
              isAuthenticated: true,
            })
            await updateServerCookie(
              persisted.accessToken,
              cookieMaxAgeFor(persisted.refreshTokenExpiresAt, state.clockSkewMs),
            )
            return "ok"
          } catch (error) {
            console.error("[AuthStore] Could not adopt tokens from another tab:", error)
          }
        }

        const currentRefreshToken = persisted?.refreshToken || state.refreshToken

        let response
        try {
          console.info("[AuthStore] Solicitando refresh-token…")
          response = await serviceRefreshToken({ refreshToken: currentRefreshToken })
        } catch (error) {
          console.error("[AuthStore] Refresh error:", error)
          return "transient"
        }

        // Sin respuesta = error de red / CORS / timeout → reintentable
        if (!response) return "transient"

        if (response.status !== 200) {
          console.error("[AuthStore] Refresh failed:", response.status)
          return response.status === 401 || response.status === 403 ? "invalid" : "transient"
        }

        const data = response.data as RefreshTokenResponse

        if (!data?.accessToken) {
          console.error("[AuthStore] Refresh response without accessToken")
          return "transient"
        }

        // Nombre canónico desde 2026-08-01; el anterior queda como respaldo.
        const refreshExpiresAt =
          parseExpiresIn(data.refreshTokenExpiresIn) ??
          parseExpiresIn(data.refreshExpiresIn) ??
          // Si no viene, conservamos la expiración anterior en vez de dejarla en 0
          get().refreshTokenExpiresAt

        try {
          const user = decodeUserFromToken(data.accessToken)
          const clockSkewMs = measureClockSkew(data.accessToken) ?? state.clockSkewMs
          const accessTokenExpiresAt = resolveAccessTokenExpiresAt(
            data.accessToken,
            data.accessTokenExpiresIn ?? data.accessExpiresIn,
          )

          set({
            user,
            accessToken: data.accessToken,
            accessTokenExpiresAt,
            accessTokenRefreshAt: computeRefreshAt(data.accessToken, accessTokenExpiresAt, clockSkewMs),
            refreshToken: data.refreshToken ?? currentRefreshToken,
            refreshTokenExpiresAt: refreshExpiresAt,
            clockSkewMs,
            isAuthenticated: true,
          })
        } catch (error) {
          console.error("[AuthStore] Could not decode refreshed token:", error)
          return "invalid"
        }

        await updateServerCookie(data.accessToken, cookieMaxAgeFor(refreshExpiresAt, get().clockSkewMs))
        return "ok"
      }

      /** Refresh con reintentos ante fallos transitorios y deduplicado entre llamadas */
      const refreshWithRetry = (): Promise<RefreshOutcome> => {
        if (refreshPromise) return refreshPromise

        if (cooldownTimer) {
          clearTimeout(cooldownTimer)
          cooldownTimer = null
        }

        // Detener worker mientras refrescamos para no disparar llamadas en paralelo
        get().stopWorker()

        const promise = (async () => {
          let outcome: RefreshOutcome = "transient"

          for (let attempt = 0; attempt <= REFRESH_RETRY_DELAYS_MS.length; attempt++) {
            outcome = await attemptRefresh()

            if (outcome !== "transient") break

            // Si el refresh token ya venció no tiene sentido seguir insistiendo
            const { refreshTokenExpiresAt, accessTokenExpiresAt, clockSkewMs } = get()
            const now = serverNow(clockSkewMs)
            if (refreshTokenExpiresAt > 0 && refreshTokenExpiresAt <= now) {
              outcome = "invalid"
              break
            }
            // El backend sólo refresca con el access token vigente: si ya venció,
            // reintentar es inútil y sólo retrasa el aviso al usuario.
            if (accessTokenExpiresAt > 0 && accessTokenExpiresAt <= now) {
              outcome = "invalid"
              break
            }

            const delay = REFRESH_RETRY_DELAYS_MS[attempt]
            if (delay === undefined) break
            await new Promise((resolve) => setTimeout(resolve, delay))
          }

          if (outcome === "ok") {
            get().initWorker()
          }

          return outcome
        })()

        refreshPromise = promise
        void promise.finally(() => {
          if (refreshPromise === promise) refreshPromise = null
        })

        return promise
      }

      /** Lanza el refresh y decide qué hacer según el resultado (worker, timers y eventos usan esto) */
      const triggerRefresh = () => {
        void refreshWithRetry()
          .then((outcome) => {
            if (outcome === "ok") return

            if (outcome === "invalid") {
              get().endSession()
              return
            }

            // Fallo transitorio (red/5xx): NO cerramos sesión, reintentamos luego
            console.warn("[AuthStore] Refresh temporarily unavailable, will retry")
            if (cooldownTimer) clearTimeout(cooldownTimer)
            cooldownTimer = setTimeout(() => {
              cooldownTimer = null
              get().initWorker()
            }, REFRESH_COOLDOWN_MS)
          })
          .catch((error) => {
            console.error("[AuthStore] Unexpected refresh error:", error)
          })
      }

      /**
       * Revisa el estado de la sesión y renueva si toca. Se llama desde el timer de
       * respaldo y desde los eventos del navegador (volver a la pestaña, foco, red).
       */
      const evaluateSession = () => {
        const s = get()
        if (!s.isAuthenticated) return

        const now = serverNow(s.clockSkewMs)

        // Aunque el reloj diga que el refresh token venció, no cerramos por
        // nuestra cuenta: intentamos renovar y sólo terminamos si el backend
        // lo rechaza (401/403). La única fuente de verdad es el servidor.
        if (s.refreshTokenExpiresAt > 0 && s.refreshTokenExpiresAt <= now) {
          triggerRefresh()
          return
        }

        if (s.accessTokenRefreshAt > 0 && now >= s.accessTokenRefreshAt) {
          triggerRefresh()
        }
      }

      return {
      // State inicial
      user: null,
      company: null,
      accessToken: null,
      accessTokenExpiresAt: 0,
      accessTokenRefreshAt: 0,
      refreshToken: null,
      refreshTokenExpiresAt: 0,
      clockSkewMs: 0,
      isAuthenticated: false,
      hydrated: false,

      // ============================================
      // LOGIN
      // ============================================
      login: async (email: string, password: string, companyId: string, companyName: string, companyLogo: string) => {
        try {
          const encrypted = await encryptRsa(password)

          const response = await serviceLoginManagerUserAuth({
            email,
            password: encrypted,
            companyId,
          })

          if (response?.status !== 200) {
            console.error("[AuthStore] Login failed:", response?.status)
            return false
          }

          const data: LoginResponse = response.data

          const user = decodeUserFromToken(data.accessToken)

          const refreshTokenExpiresAt =
            parseExpiresIn(data.refreshTokenExpiresIn) ??
            parseExpiresIn(data.refreshExpiresIn) ??
            0

          // El login es el mejor momento para medir el desfase de reloj: el token
          // acaba de emitirse, así que su `iat` es prácticamente el "ahora" del servidor.
          const clockSkewMs = measureClockSkew(data.accessToken) ?? 0
          const accessTokenExpiresAt = resolveAccessTokenExpiresAt(
            data.accessToken,
            data.accessTokenExpiresIn ?? data.accessExpiresIn,
          )

          if (clockSkewMs !== 0) {
            console.warn(
              `[AuthStore] El reloj del equipo va ${clockSkewMs > 0 ? "adelantado" : "atrasado"} ` +
                `${Math.round(Math.abs(clockSkewMs) / 1000)}s respecto del servidor; se compensa.`,
            )
          }

          const newState = {
            user,
            company: {
              id: companyId,
              name: companyName,
              logo: companyLogo,
            },
            accessToken: data.accessToken,
            accessTokenExpiresAt,
            accessTokenRefreshAt: computeRefreshAt(data.accessToken, accessTokenExpiresAt, clockSkewMs),
            refreshToken: data.refreshToken,
            refreshTokenExpiresAt,
            clockSkewMs,
            isAuthenticated: true,
          }

          set(newState)

          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(SESSION_END_REASON_KEY)
          }

          // Actualizar cookie del servidor
          await updateServerCookie(data.accessToken, cookieMaxAgeFor(refreshTokenExpiresAt, clockSkewMs))

          // Iniciar worker
          get().initWorker()

          return true
        } catch (error) {
          console.error("[AuthStore] Login error:", error)
          return false
        }
      },

      // ============================================
      // LOGOUT
      // ============================================
      logout: (): Promise<void> => {
        // Limpiar worker
        get().clearWorker()

        if (cooldownTimer) {
          clearTimeout(cooldownTimer)
          cooldownTimer = null
        }

        // Limpiar estado
        set({
          user: null,
          company: null,
          accessToken: null,
          accessTokenExpiresAt: 0,
          accessTokenRefreshAt: 0,
          refreshToken: null,
          refreshTokenExpiresAt: 0,
          isAuthenticated: false,
        })

        // Limpiar cookie del servidor. `keepalive` para que la petición sobreviva
        // a la navegación dura que hacen los llamadores justo después.
        return fetch("/api/auth/logout", { method: "POST", keepalive: true })
          .catch(console.error)
          .then(() => undefined)
      },

      /** Cierre de sesión provocado por expiración: deja constancia para avisar en el login */
      endSession: () => {
        markSessionEndReason("expired")
        void get().logout()
        if (typeof window !== "undefined") {
          window.location.href = getLoginUrl()
        }
      },

      // ============================================
      // REFRESH TOKEN
      // ============================================
      refresh: async (): Promise<boolean> => {
        const outcome = await refreshWithRetry()
        return outcome === "ok"
      },

      refreshSession: (): Promise<RefreshOutcome> => refreshWithRetry(),

      // ============================================
      // WORKER MANAGEMENT
      // ============================================
      initWorker: () => {
        const state = get()

        if (!state.isAuthenticated || !state.accessTokenExpiresAt) {
          return
        }

        // Crear worker si no existe. Si el navegador no lo permite seguimos igual:
        // el timer de respaldo del hilo principal se encarga de renovar.
        if (!workerInstance) {
          try {
            workerInstance = createRefreshTokenWorker()

            // Manejar mensajes del worker
            workerInstance.onmessage = (event: MessageEvent) => {
              const { type } = event.data

              switch (type) {
                case "NEEDS_REFRESH":
                  triggerRefresh()
                  break

                case "SESSION_EXPIRED":
                  // El worker sólo mira el reloj. Antes de cerrar, damos una
                  // última oportunidad al backend: si el refresh token todavía
                  // sirve, la sesión sigue; si no, `triggerRefresh` la termina.
                  triggerRefresh()
                  break

                default:
                  console.error("[AuthStore] Unknown worker message:", type)
              }
            }

            workerInstance.onerror = (error) => {
              console.error("[AuthStore] Worker error (usando respaldo del hilo principal):", error)
            }
          } catch (error) {
            console.error("[AuthStore] Could not start refresh worker, falling back to timer:", error)
            workerInstance = null
          }
        }

        // Los timers de una pestaña en segundo plano se ralentizan (o se congelan):
        // al volver a primer plano, recuperar la conexión o recibir el foco hay que
        // reevaluar de inmediato, porque el refresh sólo sirve si el access token vive.
        if (typeof document !== "undefined" && !visibilityHandler) {
          visibilityHandler = () => {
            if (document.visibilityState !== "visible") return
            evaluateSession()
          }
          document.addEventListener("visibilitychange", visibilityHandler)
          window.addEventListener("focus", visibilityHandler)
          window.addEventListener("online", visibilityHandler)
        }

        // Red de seguridad: si el Web Worker no llegó a cargar (blob bloqueado,
        // navegador restrictivo…) nadie renovaría la sesión y moriría en silencio.
        if (typeof window !== "undefined" && !fallbackInterval) {
          fallbackInterval = setInterval(evaluateSession, FALLBACK_CHECK_INTERVAL_MS)
        }

        // Sincronizar tokens entre pestañas: si otra pestaña refrescó, adoptamos
        // sus tokens en lugar de intentar refrescar con uno ya rotado.
        if (typeof window !== "undefined" && !storageHandler) {
          storageHandler = (event: StorageEvent) => {
            if (event.key !== STORAGE_KEY) return
            const persisted = readPersistedTokens()
            const current = get()
            if (!persisted?.accessToken) return
            if (persisted.accessToken === current.accessToken) return
            if (!current.isAuthenticated) return

            try {
              set({
                user: decodeUserFromToken(persisted.accessToken),
                accessToken: persisted.accessToken,
                accessTokenExpiresAt: persisted.accessTokenExpiresAt,
                accessTokenRefreshAt: computeRefreshAt(
                  persisted.accessToken,
                  persisted.accessTokenExpiresAt,
                  current.clockSkewMs,
                ),
                refreshToken: persisted.refreshToken,
                refreshTokenExpiresAt: persisted.refreshTokenExpiresAt,
              })
              get().initWorker()
            } catch {
              /* token ilegible: lo ignoramos, el worker seguirá su curso */
            }
          }
          window.addEventListener("storage", storageHandler)
        }

        // Enviar tiempos de expiración al worker
        const current = get()
        const skew = current.clockSkewMs
        const refreshAt =
          current.accessTokenRefreshAt ||
          (current.accessToken ? computeRefreshAt(current.accessToken, current.accessTokenExpiresAt, skew) : 0)

        // El worker compara contra su propio `Date.now()`, así que le pasamos las
        // fechas ya convertidas al reloj del equipo (server + desfase).
        const toClientClock = (timestamp: number) => (timestamp > 0 ? timestamp + skew : 0)

        workerInstance?.postMessage({
          type: "SET_TOKEN_EXPIRATION",
          payload: {
            accessTokenExpiresAt: toClientClock(current.accessTokenExpiresAt),
            refreshTokenExpiresAt: toClientClock(current.refreshTokenExpiresAt),
            refreshAt: toClientClock(refreshAt),
          },
        })

        // Traza para poder verificar en consola cuándo se va a renovar
        // (en hora del equipo, para que coincida con lo que ve el usuario)
        console.info(
          "[AuthStore] Sesión activa · access expira",
          new Date(toClientClock(current.accessTokenExpiresAt)).toLocaleString(),
          "· se renueva",
          refreshAt ? new Date(toClientClock(refreshAt)).toLocaleString() : "n/d",
          "· refresh token expira",
          current.refreshTokenExpiresAt
            ? new Date(toClientClock(current.refreshTokenExpiresAt)).toLocaleString()
            : "n/d",
        )

        // Si ya estamos dentro de la ventana (p. ej. la app estuvo cerrada un rato), renovar ya
        evaluateSession()
      },

      stopWorker: () => {
        if (workerInstance) {
          workerInstance.postMessage({ type: "STOP" })
        }
      },

      clearWorker: () => {
        if (fallbackInterval) {
          clearInterval(fallbackInterval)
          fallbackInterval = null
        }
        if (workerInstance) {
          workerInstance.postMessage({ type: "CLEAR" })
          workerInstance.terminate()
          if (workerInstance.__objectUrl) {
            URL.revokeObjectURL(workerInstance.__objectUrl)
          }
          workerInstance = null
        }
        if (typeof document !== "undefined" && visibilityHandler) {
          document.removeEventListener("visibilitychange", visibilityHandler)
          window.removeEventListener("focus", visibilityHandler)
          window.removeEventListener("online", visibilityHandler)
          visibilityHandler = null
        }
        if (typeof window !== "undefined" && storageHandler) {
          window.removeEventListener("storage", storageHandler)
          storageHandler = null
        }
      },

      // ============================================
      // HYDRATION
      // ============================================
      setHydrated: (hydrated: boolean) => {
        set({ hydrated })
      },
      }
    },
    {
      name: STORAGE_KEY, // localStorage key

      // Callback después de hidratar desde localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ya no cerramos sesión acá comparando fechas contra el reloj del equipo:
          // si el refresh token de verdad venció, el primer intento de renovación
          // recibirá un 401 y `endSession()` se encargará con el motivo correcto.
          if (state.isAuthenticated) {
            // Sesiones guardadas antes de este cambio no traen la ventana de renovación
            if (state.accessToken && !state.accessTokenRefreshAt) {
              state.accessTokenRefreshAt = computeRefreshAt(
                state.accessToken,
                state.accessTokenExpiresAt,
                state.clockSkewMs,
              )
            }
            // Renovar la cookie httpOnly: si caduca antes que el refresh token,
            // el layout del servidor redirige a /login-error con la sesión viva.
            if (state.accessToken) {
              void updateServerCookie(
                state.accessToken,
                cookieMaxAgeFor(state.refreshTokenExpiresAt, state.clockSkewMs),
              )
            }
            // Iniciar worker si hay sesión válida
            state.initWorker()
          }

          state.setHydrated(true)
        }
      },
    }
  )
)

// ============================================
// SELECTORS (para optimización)
// ============================================

const DEFAULT_REQUIRED_OPTIONS: RequiredOptions = { credentialsSignature: false, professionalInformation: false }

export const selectUser = (state: AuthStore) => state.user
export const selectCompany = (state: AuthStore) => state.company
export const selectToken = (state: AuthStore) => state.accessToken
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectHydrated = (state: AuthStore) => state.hydrated
export const selectRequiredOptions = (state: AuthStore) => state.user?.requiredOptions ?? DEFAULT_REQUIRED_OPTIONS
export const selectMemberUserTypes = (state: AuthStore) => state.user?.memberUserTypes ?? []
