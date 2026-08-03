
export type Role = string

export interface RequiredOptions {
  credentialsSignature: boolean
  professionalInformation: boolean
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  permissions: string[]
  memberUserTypes: string[]
  requiredOptions: RequiredOptions
  expiresAt: string
}

export interface CompanyInfo {
  id: string
  name: string
  logo: string
}

export interface TokenState {
  accessToken: string | null
  accessTokenExpiresAt: number
  /**
   * Momento a partir del cual hay que renovar. El backend sólo permite refrescar
   * con el access token vigente, así que se renueva bastante antes del vencimiento.
   */
  accessTokenRefreshAt: number
  refreshToken: string | null
  refreshTokenExpiresAt: number
  /**
   * Diferencia entre el reloj del equipo y el del servidor (positivo = el equipo
   * va adelantado). El backend manda las expiraciones como fecha absoluta suya,
   * así que sin esta corrección un reloj mal puesto cerraría la sesión sola.
   */
  clockSkewMs: number
}

export interface AuthState extends TokenState {
  user: User | null
  company: CompanyInfo | null
  isAuthenticated: boolean
  hydrated: boolean
}

// Desde 2026-08-01 login y refresh usan los mismos nombres (`accessTokenExpiresIn` /
// `refreshTokenExpiresIn`) y devuelven fecha ISO absoluta. Los nombres viejos quedan
// como opcionales para no romper si algún entorno todavía no está actualizado.
export interface LoginResponse {
  accessToken: string
  accessTokenExpiresIn: string
  refreshToken: string
  refreshTokenExpiresIn: string
  passwordExpirationDate?: string
  /** @deprecated nombre anterior de `accessTokenExpiresIn` */
  accessExpiresIn?: string
  /** @deprecated nombre anterior de `refreshTokenExpiresIn` */
  refreshExpiresIn?: string
}

export interface RefreshTokenResponse {
  accessToken: string
  accessTokenExpiresIn: string
  refreshToken: string
  refreshTokenExpiresIn: string
  /** @deprecated nombre anterior de `accessTokenExpiresIn` */
  accessExpiresIn?: string
  /** @deprecated nombre anterior de `refreshTokenExpiresIn` */
  refreshExpiresIn?: string
}
