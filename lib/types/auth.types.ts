
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
}

export interface AuthState extends TokenState {
  user: User | null
  company: CompanyInfo | null
  isAuthenticated: boolean
  hydrated: boolean
}

// El backend nombra distinto los campos de expiración en login y en refresh,
// por eso ambos aceptan las dos variantes (se toma la que venga informada).
export interface LoginResponse {
  accessToken: string
  accessTokenExpiresIn: string
  refreshToken: string
  refreshTokenExpiresIn: string
  accessExpiresIn?: string
  refreshExpiresIn?: string
}

export interface RefreshTokenResponse {
  accessToken: string
  accessExpiresIn: string
  refreshToken: string
  refreshExpiresIn: string
  accessTokenExpiresIn?: string
  refreshTokenExpiresIn?: string
}
