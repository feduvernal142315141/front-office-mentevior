export interface PublicKeyResponse {
  publicKey: string;
}

export type LoginManagerUserAuthRequest = {
  email: string;
  password: string;
};

export type LoginManagerUserAuthResponse = {
  accessToken: string;
  accessTokenExpiresIn: string;
  refreshToken: string;
  refreshTokenExpiresIn: string;
};

// Refresh Token Types
export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  accessExpiresIn: string;
  refreshToken: string;
  refreshExpiresIn: string;
};