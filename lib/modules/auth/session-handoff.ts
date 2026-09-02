import type { AuthTokensResponse } from "@/lib/models/login/login"

/**
 * Traspaso de sesión entre subdominios.
 *
 * El login neutral corre en `app.frontoffice…` pero la sesión tiene que quedar en
 * `{slug}.frontoffice…`, y son orígenes distintos: ni el store persistido en
 * localStorage ni la cookie httpOnly (que se setea sin `domain`) cruzan de uno a
 * otro. Así que los tokens viajan en el **fragmento** de la URL —que el navegador
 * nunca manda al servidor, a diferencia del query string— y la sesión se arma del
 * otro lado, donde de verdad va a vivir.
 *
 * El destino siempre se construye a partir de un slug validado contra un dominio
 * base conocido (ver `buildCompanyOrigin`), nunca con una URL que venga del backend.
 */

export const SESSION_HANDOFF_PATH = "/session-handoff"

const PARAM = {
  accessToken: "at",
  refreshToken: "rt",
  accessTokenExpiresIn: "ae",
  refreshTokenExpiresIn: "re",
} as const

export function buildSessionHandoffUrl(origin: string, tokens: AuthTokensResponse): string {
  const params = new URLSearchParams()
  params.set(PARAM.accessToken, tokens.accessToken)
  params.set(PARAM.refreshToken, tokens.refreshToken)
  if (tokens.accessTokenExpiresIn) {
    params.set(PARAM.accessTokenExpiresIn, tokens.accessTokenExpiresIn)
  }
  if (tokens.refreshTokenExpiresIn) {
    params.set(PARAM.refreshTokenExpiresIn, tokens.refreshTokenExpiresIn)
  }

  return `${origin}${SESSION_HANDOFF_PATH}#${params.toString()}`
}

export function readSessionHandoffTokens(hash: string): AuthTokensResponse | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash
  if (!raw) return null

  const params = new URLSearchParams(raw)
  const accessToken = params.get(PARAM.accessToken)
  const refreshToken = params.get(PARAM.refreshToken)

  if (!accessToken || !refreshToken) return null

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: params.get(PARAM.accessTokenExpiresIn) ?? "",
    refreshTokenExpiresIn: params.get(PARAM.refreshTokenExpiresIn) ?? "",
  }
}
