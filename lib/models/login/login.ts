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

export type AuthTokensResponse = {
  accessToken: string;
  accessTokenExpiresIn: string;
  refreshToken: string;
  refreshTokenExpiresIn: string;
  passwordExpirationDate?: string | null;
};

/** @deprecated usar `AuthTokensResponse` */
export type LoginManagerUserAuthResponse = AuthTokensResponse;

/**
 * Reto OTP abierto: lo devuelven `login`, `global-login` y los dos reenvíos.
 * El `otpChallengeId` identifica este intento concreto y hay que mandarlo en todos
 * los pasos siguientes; cada reenvío emite uno nuevo que reemplaza al anterior.
 */
export type OtpChallengeIssued = {
  otpSent: boolean;
  otpChallengeId: string;
  /** Fecha ISO absoluta en la que el código deja de servir */
  otpExpiresIn: string;
  otpLength: number;
  resendCooldownSeconds: number;
};

/**
 * `login` y `global-login` validan credenciales y mandan el código. El shape con
 * tokens queda contemplado porque un backend anterior a este cambio responde así,
 * y el front tiene que servir contra los dos mientras se despliegan.
 */
export type OtpChallengeResponse = OtpChallengeIssued | AuthTokensResponse | boolean;

/** Intentos fallidos antes de que el backend invalide el código y bloquee la cuenta. */
export const MAX_OTP_ATTEMPTS = 3;

/** Compañía que coincide con el email y la contraseña en el login neutral. */
export type MatchedCompany = {
  companyName: string;
  slug: string;
};

export type GlobalLoginRequest = {
  email: string;
  password: string;
  slug: string;
};

export type CompanyLoginRequest = {
  email: string;
  password: string;
  slug: string;
  /** El challenge que `validate-otp-global` dejó verificado */
  otpChallengeId: string;
};

export type ValidateOtpRequest = {
  email: string;
  companyId: string;
  otpChallengeId: string;
  otpCode: string;
};

export type ValidateOtpGlobalRequest = {
  email: string;
  slug: string;
  otpChallengeId: string;
  otpCode: string;
};

export type ResendOtpRequest = {
  email: string;
  companyId: string;
  otpChallengeId: string;
};

export type ResendOtpGlobalRequest = {
  email: string;
  slug: string;
  otpChallengeId: string;
};

/**
 * Con una sola compañía coincidente vienen los tokens y la sesión queda abierta.
 * Con varias, los tokens llegan en `null` y hay que elegir compañía y llamar a
 * `company-login`.
 */
export type ValidateOtpGlobalResponse = {
  accessToken: string | null;
  accessTokenExpiresIn: string | null;
  refreshToken: string | null;
  refreshTokenExpiresIn: string | null;
  passwordExpirationDate?: string | null;
  /** Viene informado con varias compañías (hay que pasarlo a `company-login`) y `null` con una sola */
  otpChallengeId: string | null;
  companies: MatchedCompany[];
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