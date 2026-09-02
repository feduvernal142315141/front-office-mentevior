"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/custom/Button"
import { useLoginFlow } from "@/lib/modules/auth/hooks/use-login-flow"
import { SESSION_END_REASON_KEY } from "@/lib/store/auth.store"
import type { CompanyInfo } from "@/lib/types/auth.types"

import { CompanyPickerStep } from "./CompanyPickerStep"
import { OtpStep } from "./OtpStep"

interface LoginFormProps {
  /** `null` en el login neutral: todavía no sabemos a qué organización entra el usuario */
  company: CompanyInfo | null
}

export function LoginForm({ company }: LoginFormProps) {
  const {
    step,
    email: submittedEmail,
    companies,
    challenge,
    attemptsLeft,
    error,
    notice,
    isSubmitting,
    isNeutral,
    submitCredentials,
    submitOtp,
    resendCode,
    selectCompany,
    backToCredentials,
  } = useLoginFlow({ company })

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Si llegamos acá por expiración de sesión, hay que decirlo (antes se cerraba en silencio)
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESSION_END_REASON_KEY) === "expired") {
        setSessionExpired(true)
        window.sessionStorage.removeItem(SESSION_END_REASON_KEY)
      }
    } catch {
      /* sessionStorage puede no estar disponible */
    }
  }, [])

  const handleBack = () => {
    setPassword("")
    backToCredentials()
  }

  return (
    <div className="login-card-wrapper relative w-full max-w-[440px] 2xl:max-w-[500px] bg-white rounded-[28px] p-12 2xl:p-14 login-large-screen-spacing animate-in fade-in slide-in-from-bottom-8 duration-600 delay-400">
      {step === "otp" && challenge ? (
        <OtpStep
          email={submittedEmail}
          challenge={challenge}
          attemptsLeft={attemptsLeft}
          error={error}
          notice={notice}
          isSubmitting={isSubmitting}
          onSubmit={submitOtp}
          onResend={resendCode}
          onBack={handleBack}
        />
      ) : step === "company" ? (
        <CompanyPickerStep
          companies={companies}
          error={error}
          isSubmitting={isSubmitting}
          onSelect={selectCompany}
          onBack={handleBack}
        />
      ) : (
        <>
          <div className="mb-9 2xl:mb-11 animate-in fade-in duration-500 delay-600">
            <h3 className="text-[26px] 2xl:text-[28px] font-semibold text-[var(--color-login-text-primary)] mb-2">
              Sign in to your account
            </h3>
            <p className="text-[14px] 2xl:text-[15px] text-[var(--color-login-text-secondary)] leading-relaxed">
              {isNeutral ? (
                <>
                  Enter your credentials{" "}
                  <span className="text-[var(--color-login-text-muted)]">
                    and we&apos;ll find your organization
                  </span>
                </>
              ) : (
                <>
                  Enter your credentials{" "}
                  <span className="text-[var(--color-login-text-muted)]">
                    and continue where you left off
                  </span>
                </>
              )}
            </p>
          </div>

          {sessionExpired && (
            <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <p className="text-[13px] 2xl:text-[14px] text-amber-700 font-medium">
                Your session expired. Please sign in again to continue.
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submitCredentials(email, password)
            }}
            className="space-y-5 2xl:space-y-6"
          >
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400 delay-700">
              <label
                htmlFor="email"
                className="block text-[13px] 2xl:text-[14px] font-medium text-[var(--color-login-text-primary)]"
              >
                Email <span className="text-[#2563EB]">*</span>
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="username"
                className="premium-input h-[52px] 2xl:h-[56px] px-4 rounded-[16px] text-[15px] 2xl:text-[16px]"
              />
            </div>

            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400 delay-800">
              <label
                htmlFor="password"
                className="block text-[13px] 2xl:text-[14px] font-medium text-[var(--color-login-text-primary)]"
              >
                Password <span className="text-[#2563EB]">*</span>
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`
                    premium-input
                    h-[52px] 2xl:h-[56px]
                    px-4 pr-12 rounded-[16px]
                    text-[15px] 2xl:text-[16px]
                    ${error ? "border-red-400/50 focus:ring-red-400/30" : ""}
                  `}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute right-4 top-1/2 -translate-y-1/2
                    text-[var(--color-login-text-muted)]
                    hover:text-[var(--color-login-text-secondary)]
                    transition-colors duration-200
                  "
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className="
                  mt-2
                  rounded-xl
                  border border-red-500/30
                  bg-red-500/10
                  px-4 py-3
                  animate-in fade-in slide-in-from-top-1 duration-200
                ">
                  <p className="text-[13px] text-red-500 font-medium">{error}</p>
                </div>
              )}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 delay-900">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="
                  w-full h-[52px] 2xl:h-[56px]
                  rounded-[16px]
                  premium-button
                  text-white text-[15px] 2xl:text-[16px] font-semibold
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>

            {!isNeutral && (
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-[13px] text-black hover:text-[#2563EB] transition-colors duration-200"
                >
                  Forgot password
                </Link>
              </div>
            )}
          </form>
        </>
      )}

      <div className="mt-10 2xl:mt-12 pt-2 animate-in fade-in duration-400 delay-1200">
        <p className="text-[12px] 2xl:text-[13px] text-center text-[var(--color-login-text-muted)] opacity-60">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  )
}
