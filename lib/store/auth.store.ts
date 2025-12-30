/**
 * AUTH STORE - ZUSTAND
 * Single Source of Truth para autenticación
 * 
 * Maneja:
 * - Login/Logout
 * - Tokens (access + refresh)
 * - Refresh automático con Web Worker
 * - Persistencia en localStorage + cookies
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { jwtDecode } from "jwt-decode"
import type { User, AuthState, LoginResponse, RefreshTokenResponse } from "@/lib/types/auth.types"
import { encryptRsa } from "@/lib/utils/encrypt"
import { serviceLoginManagerUserAuth, serviceRefreshToken } from "@/lib/services/login/login"
import { createRefreshTokenWorker } from "@/lib/workers/refresh-token-worker"

let workerInstance: Worker | null = null
let isRefreshing = false


function parseExpiresIn(expiresIn: string, fromTimestamp?: number): number {
  const now = fromTimestamp || Date.now()
  const value = parseInt(expiresIn.slice(0, -1), 10)
  const unit = expiresIn.slice(-1).toLowerCase()

  let milliseconds = 0

  switch (unit) {
    case "s":
      milliseconds = value * 1000
      break
    case "m":
      milliseconds = value * 60 * 1000
      break
    case "h":
      milliseconds = value * 60 * 60 * 1000
      break
    case "d":
      milliseconds = value * 24 * 60 * 60 * 1000
      break
    default:
      milliseconds = parseInt(expiresIn, 10) * 1000
  }

  return now + milliseconds
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
 * Decodifica JWT y extrae User
 */
function decodeUserFromToken(accessToken: string): User {
  const decoded: any = jwtDecode(accessToken)

  return {
    id: decoded.Id,
    email: decoded.username,
    name: decoded.fullName,
    role: decoded.role,
    permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],  // ⚡ Array de "modulo-valor"
    expiresAt: new Date(decoded.exp * 1000).toISOString(),
  }
}

/**
 * Actualiza la cookie del servidor
 */
async function updateServerCookie(accessToken: string) {
  try {
    await fetch("/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: accessToken }),
    })
  } catch (error) {
    console.error("[AuthStore] Error updating server cookie:", error)
  }
}

// ============================================
// STORE INTERFACE
// ============================================

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refresh: () => Promise<void>
  
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
    (set, get) => ({
      // State inicial
      user: null,
      accessToken: null,
      accessTokenExpiresAt: 0,
      refreshToken: null,
      refreshTokenExpiresAt: 0,
      isAuthenticated: false,
      hydrated: false,

      // ============================================
      // LOGIN
      // ============================================
      login: async (email: string, password: string) => {
        try {
          const encrypted = await encryptRsa(password)

          const response = await serviceLoginManagerUserAuth({
            email,
            password: encrypted,
          })

          if (response?.status !== 200) {
            console.error("[AuthStore] Login failed:", response?.status)
            return false
          }

          const data: LoginResponse = response.data

          const user = decodeUserFromToken(data.accessToken)

          const newState = {
            user,
            accessToken: data.accessToken,
            accessTokenExpiresAt: getTokenExpiration(data.accessToken),
            refreshToken: data.refreshToken,
            refreshTokenExpiresAt: parseExpiresIn(data.refreshTokenExpiresIn),
            isAuthenticated: true,
          }

          set(newState)

          // Actualizar cookie del servidor
          await updateServerCookie(data.accessToken)

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
      logout: () => {
        // Limpiar worker
        get().clearWorker()

        // Limpiar estado
        set({
          user: null,
          accessToken: null,
          accessTokenExpiresAt: 0,
          refreshToken: null,
          refreshTokenExpiresAt: 0,
          isAuthenticated: false,
        })

        // Limpiar cookie del servidor
        fetch("/api/auth/logout", { method: "POST" }).catch(console.error)
      },

      // ============================================
      // REFRESH TOKEN
      // ============================================
      refresh: async () => {
        const state = get()

        // Prevenir múltiples refreshes simultáneos
        if (isRefreshing || !state.refreshToken) {
          return
        }

        isRefreshing = true

        // Detener worker temporalmente
        get().stopWorker()

        try {
          const response = await serviceRefreshToken({
            refreshToken: state.refreshToken,
          })

          if (response?.status !== 200) {
            console.error("[AuthStore] Refresh failed:", response?.status)
            
            // Solo logout en errores de autenticación
            if (response?.status === 401 || response?.status === 403) {
              get().logout()
            } else {
              // Reintentar más tarde
              setTimeout(() => {
                get().initWorker()
              }, 10000)
            }
            return
          }

          const data: RefreshTokenResponse = response.data

          const user = decodeUserFromToken(data.accessToken)

          const newState = {
            user,
            accessToken: data.accessToken,
            accessTokenExpiresAt: getTokenExpiration(data.accessToken),
            refreshToken: data.refreshToken,
            refreshTokenExpiresAt: parseExpiresIn(data.refreshExpiresIn),
            isAuthenticated: true,
          }

          set(newState)

          // Actualizar cookie del servidor
          await updateServerCookie(data.accessToken)

          // Reiniciar worker con nuevos tiempos
          get().initWorker()
        } catch (error) {
          console.error("[AuthStore] Refresh error:", error)
          get().logout()
        } finally {
          isRefreshing = false
        }
      },

      // ============================================
      // WORKER MANAGEMENT
      // ============================================
      initWorker: () => {
        const state = get()

        if (!state.isAuthenticated || !state.accessTokenExpiresAt) {
          return
        }

        // Crear worker si no existe
        if (!workerInstance) {
          workerInstance = createRefreshTokenWorker()

          // Manejar mensajes del worker
          workerInstance.onmessage = (event: MessageEvent) => {
            const { type } = event.data

            switch (type) {
              case "NEEDS_REFRESH":
                get().refresh()
                break

              case "SESSION_EXPIRED":
                get().logout()
                if (typeof window !== "undefined") {
                  window.location.href = "/login"
                }
                break

              default:
                console.error("[AuthStore] Unknown worker message:", type)
            }
          }

          workerInstance.onerror = (error) => {
            console.error("[AuthStore] Worker error:", error)
          }
        }

        // Enviar tiempos de expiración al worker
        workerInstance.postMessage({
          type: "SET_TOKEN_EXPIRATION",
          payload: {
            accessTokenExpiresAt: state.accessTokenExpiresAt,
            refreshTokenExpiresAt: state.refreshTokenExpiresAt,
          },
        })
      },

      stopWorker: () => {
        if (workerInstance) {
          workerInstance.postMessage({ type: "STOP" })
        }
      },

      clearWorker: () => {
        if (workerInstance) {
          workerInstance.postMessage({ type: "CLEAR" })
          workerInstance.terminate()
          workerInstance = null
        }
      },

      // ============================================
      // HYDRATION
      // ============================================
      setHydrated: (hydrated: boolean) => {
        set({ hydrated })
      },
    }),
    {
      name: "mv-auth", // localStorage key
      
      // Callback después de hidratar desde localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const now = Date.now()

          // Si el refresh token ya expiró, limpiar sesión
          if (state.refreshTokenExpiresAt && state.refreshTokenExpiresAt <= now) {
            console.warn("[AuthStore] Stored refresh token expired, clearing session")
            state.logout()
          } else if (state.isAuthenticated) {
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

export const selectUser = (state: AuthStore) => state.user
export const selectToken = (state: AuthStore) => state.accessToken
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectHydrated = (state: AuthStore) => state.hydrated
