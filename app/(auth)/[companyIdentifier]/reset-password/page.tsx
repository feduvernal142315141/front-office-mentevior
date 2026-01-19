"use client"

import { Suspense, useEffect } from "react"
import { useParams } from "next/navigation"
import { useCompanyConfig } from "@/lib/modules/auth/hooks/use-company-config"
import { useResetPassword } from "@/lib/modules/auth/hooks/use-reset-password"
import { usePasswordValidation } from "@/app/(app)/change-password/hooks/usePasswordValidation"
import { PasswordField } from "@/components/password/PasswordField"
import { PasswordRequirements } from "@/components/password/PasswordRequirements"
import { PasswordMismatchMessage } from "@/components/password/PasswordMismatchMessage"
import { Button } from "@/components/custom/Button"
import { Loader2, AlertCircle } from "lucide-react"
import { setCompanyIdentifier } from "@/lib/utils/company-identifier"

function ResetPasswordContent() {
  const params = useParams()
  const companyIdentifier = params?.companyIdentifier as string

  const { companyConfig, isLoading: isLoadingCompany, error: companyError } = useCompanyConfig(companyIdentifier)

  useEffect(() => {
    if (companyIdentifier) {
      setCompanyIdentifier(companyIdentifier)
    }
  }, [companyIdentifier])

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
  } = useResetPassword(companyConfig?.id || "")

  const validation = usePasswordValidation(newPassword, confirmPassword)

  const showMismatch = confirmPassword.length > 0 && !validation.passwordsMatch

  if (isLoadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading company information...</p>
        </div>
      </div>
    )
  }

  if (companyError || !companyConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Company Not Found</h2>
          <p className="text-sm text-gray-600">
            {companyError || "The company you're trying to access doesn't exist or is not available."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="
        min-h-screen relative overflow-hidden
        bg-[#F8FAFC] text-gray-900
        [color-scheme:light]
      "
    >
      <div
        className="
          absolute inset-0 opacity-40
          bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0dGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]
        "
      />

      <div className="absolute top-1/4 left-1/3 w-[520px] h-[520px] bg-blue-500/10 rounded-full blur-[170px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] bg-cyan-400/10 rounded-full blur-[150px]" />

      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-200">
              <img
                src={companyConfig.logo}
                alt={companyConfig.legalName}
                className="w-full h-full object-contain p-3"
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Reset Your Password
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create a new password for {companyConfig.legalName}
            </p>
          </div>

          <div
            className="
              relative rounded-[28px] p-10
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
