"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"

import { Button } from "@/components/custom/Button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import type { OtpChallengeIssued } from "@/lib/models/login/login"

interface OtpStepProps {
  email: string
  /** Reto vigente: define el largo del código, cuándo vence y cuándo se puede reenviar */
  challenge: OtpChallengeIssued
  attemptsLeft: number
  error: string | null
  notice: string | null
  isSubmitting: boolean
  onSubmit: (code: string) => void
  onResend: () => void
  onBack: () => void
}

/** Segundos que faltan para `target`, o null si el backend no mandó una fecha usable. */
function secondsUntil(target: number | null, now: number): number | null {
  if (target === null) return null
  return Math.max(0, Math.ceil((target - now) / 1000))
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function OtpStep({
  email,
  challenge,
  attemptsLeft,
  error,
  notice,
  isSubmitting,
  onSubmit,
  onResend,
  onBack,
}: OtpStepProps) {
  const otpLength = challenge.otpLength

  const [code, setCode] = useState("")
  const [now, setNow] = useState(() => Date.now())
  const [resendAt, setResendAt] = useState(
    () => Date.now() + challenge.resendCooldownSeconds * 1000,
  )
  // Un código rechazado deja los dígitos puestos: sin esto el auto-envío
  // volvería a mandar el mismo código en cuanto el usuario tocara una tecla.
  const lastSubmittedRef = useRef("")
  const wasSubmittingRef = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Cada reenvío abre un reto nuevo: campo limpio y cooldown desde cero
  useEffect(() => {
    setCode("")
    lastSubmittedRef.current = ""
    setResendAt(Date.now() + challenge.resendCooldownSeconds * 1000)
  }, [challenge.otpChallengeId, challenge.resendCooldownSeconds])

  // Se vacía al terminar cada intento fallido. Mirar sólo `error` no alcanza:
  // dos códigos malos seguidos dan el mismo mensaje y el efecto no volvería a correr.
  useEffect(() => {
    if (wasSubmittingRef.current && !isSubmitting && error) {
      setCode("")
      lastSubmittedRef.current = ""
    }
    wasSubmittingRef.current = isSubmitting
  }, [isSubmitting, error])

  const expiresAt = useMemo(() => {
    const parsed = Date.parse(challenge.otpExpiresIn)
    return Number.isNaN(parsed) ? null : parsed
  }, [challenge.otpExpiresIn])

  const secondsToExpiry = secondsUntil(expiresAt, now)
  const isExpired = secondsToExpiry === 0
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const outOfAttempts = attemptsLeft <= 0
  // Cuando el código ya no sirve, el único camino es pedir otro
  const isCodeDead = isExpired || outOfAttempts

  const submit = useCallback(
    (value: string) => {
      if (value.length !== otpLength || isSubmitting || isCodeDead) return
      if (lastSubmittedRef.current === value) return
      lastSubmittedRef.current = value
      onSubmit(value)
    },
    [isCodeDead, isSubmitting, onSubmit, otpLength],
  )

  const handleResend = useCallback(() => {
    if (resendIn > 0 || isSubmitting) return
    lastSubmittedRef.current = ""
    setCode("")
    onResend()
  }, [isSubmitting, onResend, resendIn])

  const helperMessage = outOfAttempts
    ? "You've used all the attempts for this code. Request a new one to continue."
    : isExpired
      ? "This code expired. Request a new one to continue."
      : attemptsLeft === 1
        ? "This is your last attempt with this code."
        : null

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      <div className="mb-8">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
          <MailCheck className="h-6 w-6" />
        </div>

        <h3 className="mb-2 text-[26px] 2xl:text-[28px] font-semibold text-[var(--color-login-text-primary)]">
          Check your email
        </h3>
        <p className="text-[14px] 2xl:text-[15px] leading-relaxed text-[var(--color-login-text-secondary)]">
          We sent a {otpLength}-digit verification code to{" "}
          <span className="font-medium text-[var(--color-login-text-primary)]">{email}</span>
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(code)
        }}
        className="space-y-6"
      >
        <div className="flex justify-center">
          <InputOTP
            maxLength={otpLength}
            value={code}
            onChange={setCode}
            onComplete={submit}
            disabled={isSubmitting || isCodeDead}
            autoFocus
            containerClassName="gap-2"
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: otpLength }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={`
                    h-[56px] w-[48px] rounded-[14px] border
                    text-[20px] font-semibold text-gray-900
                    transition-all duration-200
                    first:rounded-l-[14px] last:rounded-r-[14px]
                    ${error || isCodeDead ? "border-red-400/60" : "border-gray-200"}
                  `}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {secondsToExpiry !== null && !isExpired && (
          <p className="text-center text-[13px] text-[var(--color-login-text-secondary)]">
            The code expires in{" "}
            <span className="font-medium tabular-nums text-[var(--color-login-text-primary)]">
              {formatCountdown(secondsToExpiry)}
            </span>
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-[13px] font-medium text-red-500">{error}</p>
          </div>
        )}

        {helperMessage && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-[13px] font-medium text-amber-700">{helperMessage}</p>
          </div>
        )}

        {notice && !error && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-[13px] font-medium text-emerald-700">{notice}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isCodeDead || code.length !== otpLength}
          className="
            flex h-[52px] 2xl:h-[56px] w-full items-center justify-center gap-2
            rounded-[16px] premium-button
            text-[15px] 2xl:text-[16px] font-semibold text-white
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            "Verify and continue"
          )}
        </Button>

        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-black transition-colors duration-200 hover:text-[#2563EB]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Use another account
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendIn > 0 || isSubmitting}
            className="text-[#2563EB] transition-colors duration-200 hover:text-[#1d4ed8] disabled:cursor-not-allowed disabled:text-[var(--color-login-text-muted)]"
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </button>
        </div>
      </form>
    </div>
  )
}
