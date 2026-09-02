"use client"

import { useCallback, useRef, useState } from "react"

import {
  MAX_OTP_ATTEMPTS,
  type MatchedCompany,
  type OtpChallengeIssued,
} from "@/lib/models/login/login"
import type { CompanyInfo } from "@/lib/types/auth.types"
import { serviceGetCompanyConfig } from "@/lib/services/login/login"
import { useAuthStore, type AuthAttempt } from "@/lib/store/auth.store"
import { buildCompanyOrigin } from "@/lib/modules/auth/hooks/use-company-slug"
import { buildSessionHandoffUrl } from "@/lib/modules/auth/session-handoff"

export type LoginStep = "credentials" | "otp" | "company"

const SESSION_LOST_MESSAGE =
  "Your sign-in attempt expired. Please enter your credentials again."

interface UseLoginFlowOptions {
  /**
   * Compañía del subdominio actual, o `null` en el login neutral (`app.…`), donde
   * todavía no sabemos a qué organización pertenece el usuario.
   */
  company: CompanyInfo | null
}

/**
 * Orquesta el login en sus tres pasos: credenciales → código del correo →
 * (si el email existe en varias organizaciones) elegir compañía.
 *
 * Cada intento vive en un `otpChallengeId` que el backend emite al validar las
 * credenciales y que hay que devolver en los pasos siguientes; reenviar el código
 * emite uno nuevo y anula el anterior, así que siempre mandamos el último.
 *
 * La contraseña se guarda sólo en memoria porque `company-login` la vuelve a pedir.
 * Nunca toca localStorage ni el store persistido, y se borra al terminar o al volver
 * atrás. El costo es que recargar la página en mitad del flujo la pierde: en ese caso
 * se vuelve al primer paso con un mensaje, en lugar de dejar botones muertos.
 */
export function useLoginFlow({ company }: UseLoginFlowOptions) {
  const isNeutral = company === null

  const requestLoginOtp = useAuthStore((state) => state.requestLoginOtp)
  const resendLoginOtp = useAuthStore((state) => state.resendLoginOtp)
  const verifyLoginOtp = useAuthStore((state) => state.verifyLoginOtp)
  const requestGlobalOtp = useAuthStore((state) => state.requestGlobalOtp)
  const resendGlobalOtp = useAuthStore((state) => state.resendGlobalOtp)
  const verifyGlobalOtp = useAuthStore((state) => state.verifyGlobalOtp)
  const loginToCompany = useAuthStore((state) => state.loginToCompany)
  const establishSession = useAuthStore((state) => state.establishSession)

  const [step, setStep] = useState<LoginStep>("credentials")
  const [email, setEmail] = useState("")
  const [companies, setCompanies] = useState<MatchedCompany[]>([])
  const [challenge, setChallenge] = useState<OtpChallengeIssued | null>(null)
  const [failedOtpAttempts, setFailedOtpAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordRef = useRef("")
  /** El challenge que `validate-otp-global` dejó verificado, para `company-login` */
  const verifiedChallengeRef = useRef("")

  const forgetSecrets = useCallback(() => {
    passwordRef.current = ""
    verifiedChallengeRef.current = ""
  }, [])

  const backToCredentials = useCallback(
    (message?: string) => {
      forgetSecrets()
      setStep("credentials")
      setCompanies([])
      setChallenge(null)
      setFailedOtpAttempts(0)
      setNotice(null)
      setError(message ?? null)
    },
    [forgetSecrets],
  )

  /**
   * Cierra el login llevando la sesión al subdominio de la compañía. Si no se puede
   * resolver ese origen (dominio no reconocido, o ya estamos en él) la abrimos acá
   * mismo, que es preferible a dejar al usuario con tokens y sin a dónde ir.
   */
  const completeCompanySession = useCallback(
    async (attempt: Extract<AuthAttempt, { status: "company_session" }>) => {
      const origin = buildCompanyOrigin(attempt.slug)

      if (origin && origin !== window.location.origin) {
        forgetSecrets()
        window.location.href = buildSessionHandoffUrl(origin, attempt.tokens)
        return true
      }

      const config = await serviceGetCompanyConfig(attempt.slug)
      const data = config?.status === 200 ? config.data : null

      const resolved: CompanyInfo | null = data
        ? { id: data.id, name: data.legalName, logo: data.logo }
        : attempt.companyName
          ? { id: "", name: attempt.companyName, logo: "" }
          : null

      const opened = await establishSession(attempt.tokens, resolved)
      if (!opened) return false

      forgetSecrets()
      window.location.href = "/dashboard"
      return true
    },
    [establishSession, forgetSecrets],
  )

  /** Traduce el resultado del store en el siguiente paso de la pantalla. */
  const applyAttempt = useCallback(
    async (attempt: AuthAttempt): Promise<void> => {
      switch (attempt.status) {
        case "otp_sent":
          setChallenge(attempt.challenge)
          setFailedOtpAttempts(0)
          setStep("otp")
          setError(null)
          return

        case "authenticated":
          forgetSecrets()
          // Recarga dura para que el layout del servidor vea la cookie recién puesta
          window.location.href = "/dashboard"
          return

        case "company_session": {
          const done = await completeCompanySession(attempt)
          if (!done) setError("We couldn't open your session. Please try again.")
          return
        }

        case "select_company":
          verifiedChallengeRef.current = attempt.otpChallengeId
          setCompanies(attempt.companies)
          setStep("company")
          setError(null)
          return

        case "error":
          setError(attempt.message)
          return
      }
    },
    [completeCompanySession, forgetSecrets],
  )

  const submitCredentials = useCallback(
    async (nextEmail: string, password: string) => {
      setIsSubmitting(true)
      setError(null)
      setNotice(null)

      const trimmedEmail = nextEmail.trim()
      setEmail(trimmedEmail)
      passwordRef.current = password

      const attempt = isNeutral
        ? await requestGlobalOtp(trimmedEmail, password)
        : await requestLoginOtp(trimmedEmail, password, company)

      await applyAttempt(attempt)
      setIsSubmitting(false)
    },
    [applyAttempt, company, isNeutral, requestGlobalOtp, requestLoginOtp],
  )

  const submitOtp = useCallback(
    async (otpCode: string) => {
      if (!challenge) {
        backToCredentials(SESSION_LOST_MESSAGE)
        return
      }

      setIsSubmitting(true)
      setError(null)
      setNotice(null)

      const attempt = isNeutral
        ? await verifyGlobalOtp(email, otpCode, challenge.otpChallengeId)
        : await verifyLoginOtp(email, otpCode, company, challenge.otpChallengeId)

      // Los fallos de red no llegaron al backend, así que no gastaron intentos
      if (attempt.status === "error" && attempt.kind === "rejected") {
        setFailedOtpAttempts((count) => count + 1)
      }

      await applyAttempt(attempt)
      setIsSubmitting(false)
    },
    [
      applyAttempt,
      backToCredentials,
      challenge,
      company,
      email,
      isNeutral,
      verifyGlobalOtp,
      verifyLoginOtp,
    ],
  )

  /** Pide un código nuevo: reemplaza el challenge y devuelve los intentos a cero. */
  const resendCode = useCallback(async () => {
    if (!challenge) {
      backToCredentials(SESSION_LOST_MESSAGE)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setNotice(null)

    const attempt = isNeutral
      ? await resendGlobalOtp(email, challenge.otpChallengeId)
      : await resendLoginOtp(email, company, challenge.otpChallengeId)

    if (attempt.status === "otp_sent") {
      setChallenge(attempt.challenge)
      setFailedOtpAttempts(0)
      setNotice("We sent you a new code.")
    } else {
      await applyAttempt(attempt)
    }

    setIsSubmitting(false)
  }, [
    applyAttempt,
    backToCredentials,
    challenge,
    company,
    email,
    isNeutral,
    resendGlobalOtp,
    resendLoginOtp,
  ])

  const selectCompany = useCallback(
    async (slug: string) => {
      if (!passwordRef.current || !verifiedChallengeRef.current) {
        backToCredentials(SESSION_LOST_MESSAGE)
        return
      }

      setIsSubmitting(true)
      setError(null)

      const attempt = await loginToCompany(
        email,
        passwordRef.current,
        slug,
        verifiedChallengeRef.current,
      )

      // `company-login` no devuelve el nombre, pero ya lo tenemos de la lista
      const picked = companies.find((item) => item.slug === slug)
      await applyAttempt(
        attempt.status === "company_session" && picked
          ? { ...attempt, companyName: picked.companyName }
          : attempt,
      )

      setIsSubmitting(false)
    },
    [applyAttempt, backToCredentials, companies, email, loginToCompany],
  )

  return {
    step,
    email,
    companies,
    challenge,
    /** Intentos que le quedan al código antes de que el backend lo invalide */
    attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - failedOtpAttempts),
    error,
    notice,
    isSubmitting,
    isNeutral,
    submitCredentials,
    submitOtp,
    resendCode,
    selectCompany,
    backToCredentials,
  }
}
