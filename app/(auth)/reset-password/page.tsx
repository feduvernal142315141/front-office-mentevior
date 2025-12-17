"use client"

import { Suspense } from "react"
import { PageHeader } from "./components/PageHeader"
import { useResetPassword } from "@/lib/modules/auth/hooks/use-reset-password"
import { usePasswordValidation } from "@/app/(app)/change-password/hooks/usePasswordValidation"
import { PasswordField } from "@/components/password/PasswordField"
import { PasswordRequirements } from "@/components/password/PasswordRequirements"
import { PasswordMismatchMessage } from "@/components/password/PasswordMismatchMessage"
import { Button } from "@/components/custom/Button"

function ResetPasswordContent() {
  const {
    onSubmit,
    isLoading,
    error,
    confirmPassword,
    setConfirmPassword,
    newPassword,
    setNewPassword,
    touched,
    setTouched,
    isSuccess,
  } = useResetPassword()

  const validation = usePasswordValidation(newPassword, confirmPassword)

  const showMismatch =
    confirmPassword.length > 0 && !validation.passwordsMatch

  return (
    <div
      className="
        min-h-screen relative overflow-hidden
        bg-[#F8FAFC] text-gray-900
        [color-scheme:light]
      "
    >
      {/* SUBTLE GRID */}
      <div
        className="
          absolute inset-0 opacity-40
          bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0dGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]
        "
      />

      {/* SOFT GLOWS */}
      <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-blue-500/10 rounded-full blur-[170px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-cyan-400/10 rounded-full blur-[150px]" />

      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PageHeader />

          {/* CARD (igual feeling premium del Change Password) */}
          <div
            className="
              relative mt-8 rounded-[28px] p-10
              bg-white border border-gray-200
              shadow-[0_20px_40px_-12px_rgba(2,6,23,0.15)]
              transition-all duration-300
            "
          >
            <div
              className="
                pointer-events-none
                absolute inset-0 rounded-[28px]
                ring-1 ring-white/40
              "
            />

            <form onSubmit={onSubmit} className="space-y-7">
              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                onBlur={() => setTouched((t) => ({ ...t, new: true }))}
                placeholder="Enter your new password"
                hasError={
                  touched.new && newPassword.length > 0 && !validation.isValid
                }
              />

              <PasswordRequirements
                show={newPassword.length > 0}
                rules={validation}
              />

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                placeholder="Confirm your new password"
                hasError={showMismatch}
                isSuccess={confirmPassword.length > 0 && validation.passwordsMatch}
              />

              {showMismatch && <PasswordMismatchMessage />}

              {isSuccess && (
                <div
                  className="
                    rounded-xl px-4 py-3
                    bg-green-500/5 border border-green-500/20
                    text-green-700 text-sm
                  "
                >
                  Your password has been successfully changed. Please log in again.
                </div>
              )}

              {error && (
                <div
                  className="
                    rounded-xl px-4 py-3
                    bg-red-500/5 border border-red-500/20
                    text-red-700 text-sm
                  "
                >
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                type="submit"
                disabled={isLoading || !validation.isValid}
                loading={isLoading}
                className="w-full shadow-lg shadow-blue-500/25"
              >
                Reset Password
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
            Your password will be encrypted
            <br />
            using industry-standard protocols
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] [color-scheme:light]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
