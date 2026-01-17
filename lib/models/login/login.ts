export interface PublicKeyResponse {
  publicKey: string;
}

export interface CompanyConfigResponse {
  id: string;
  legalName: string;
  logo: string;
}

export type LoginManagerUserAuthRequest = {
  email: string;
  password: string;
  companyId: string;
};

export type LoginManagerUserAuthResponse = {
  accessToken: string;
  accessTokenExpiresIn: string;
  refreshToken: string;
  refreshTokenExpiresIn: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  accessExpiresIn: string;
  refreshToken: string;
  refreshExpiresIn: string;
};