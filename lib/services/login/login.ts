import {
    AuthTokensResponse,
    CompanyLoginRequest,
    GlobalLoginRequest,
    LoginManagerUserAuthRequest,
    OtpChallengeResponse,
    PublicKeyResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    CompanyConfigResponse,
    ResendOtpGlobalRequest,
    ResendOtpRequest,
    ValidateOtpGlobalRequest,
    ValidateOtpGlobalResponse,
    ValidateOtpRequest,
} from "@/lib/models/login/login"
import { ServiceResponse } from "@/lib/models/response"
import { serviceGet, servicePost, servicePostSilent } from "../baseService"


export const serviceGetPublicKey = async (
): ServiceResponse<PublicKeyResponse> => {
    return serviceGet<PublicKeyResponse>(
        `/security/public-key`
    )
}

export const serviceGetCompanyConfig = async (
    identifier: string
): ServiceResponse<CompanyConfigResponse> => {
    return serviceGet<CompanyConfigResponse>(
        `/company/get-config-by-identifier/${identifier}`
    )
}

// Todos los endpoints de login usan la variante "silent": sus errores son de
// formulario (credenciales, OTP) y se muestran en la pantalla, no como toast global.

/** Valida credenciales y manda el OTP al correo. Ya no abre sesión por sí solo. */
export const serviceLoginManagerUserAuth = async (
    data: LoginManagerUserAuthRequest): ServiceResponse<OtpChallengeResponse> => {
    return servicePostSilent<LoginManagerUserAuthRequest, OtpChallengeResponse>(
        `/member-users/auth/login`,
        data
    )
}

export const serviceValidateOtp = async (
    data: ValidateOtpRequest): ServiceResponse<AuthTokensResponse> => {
    return servicePostSilent<ValidateOtpRequest, AuthTokensResponse>(
        `/member-users/auth/validate-otp`,
        data
    )
}

/** Login neutral (slug `app`): busca el email en todas las compañías y manda el OTP. */
export const serviceGlobalLogin = async (
    data: GlobalLoginRequest): ServiceResponse<OtpChallengeResponse> => {
    return servicePostSilent<GlobalLoginRequest, OtpChallengeResponse>(
        `/member-users/auth/global-login`,
        data
    )
}

export const serviceValidateOtpGlobal = async (
    data: ValidateOtpGlobalRequest): ServiceResponse<ValidateOtpGlobalResponse> => {
    return servicePostSilent<ValidateOtpGlobalRequest, ValidateOtpGlobalResponse>(
        `/member-users/auth/validate-otp-global`,
        data
    )
}

// Los reenvíos no vuelven a pedir la contraseña: les alcanza con el challenge
// vigente, y cada uno emite un `otpChallengeId` nuevo que reemplaza al anterior.

export const serviceResendOtp = async (
    data: ResendOtpRequest): ServiceResponse<OtpChallengeResponse> => {
    return servicePostSilent<ResendOtpRequest, OtpChallengeResponse>(
        `/member-users/auth/resend-otp`,
        data
    )
}

export const serviceResendOtpGlobal = async (
    data: ResendOtpGlobalRequest): ServiceResponse<OtpChallengeResponse> => {
    return servicePostSilent<ResendOtpGlobalRequest, OtpChallengeResponse>(
        `/member-users/auth/resend-otp-global`,
        data
    )
}

/** Cierra el login neutral cuando el usuario eligió una compañía de la lista. */
export const serviceCompanyLogin = async (
    data: CompanyLoginRequest): ServiceResponse<AuthTokensResponse> => {
    return servicePostSilent<CompanyLoginRequest, AuthTokensResponse>(
        `/member-users/auth/company-login`,
        data
    )
}

export const serviceRefreshToken = async (
    data: RefreshTokenRequest): ServiceResponse<RefreshTokenResponse> => {
    return servicePost<RefreshTokenRequest, RefreshTokenResponse>(
        `/member-users/auth/refresh-token`,
        data
    )
}