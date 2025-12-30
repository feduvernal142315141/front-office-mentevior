
export type Role = string

export interface User {
  id: string
  email: string
  name: string
  role: Role
  permissions: string[]
  expiresAt: string
}

export interface TokenState {
  accessToken: string | null
  accessTokenExpiresAt: number
  refreshToken: string | null
  refreshTokenExpiresAt: number
}

export interface AuthState extends TokenState {
  user: User | null
  isAuthenticated: boolean
  hydrated: boolean
}

export interface LoginResponse {
  accessToken: string
  accessTokenExpiresIn: string
  refreshToken: string
  refreshTokenExpiresIn: string
}

export interface RefreshTokenResponse {
  accessToken: string
  accessExpiresIn: string
  refreshToken: string
  refreshExpiresIn: string
}
