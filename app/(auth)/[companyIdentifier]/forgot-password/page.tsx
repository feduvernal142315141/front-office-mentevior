"use client"

import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { useForgotPassword } from "@/lib/modules/auth/hooks/use-forgot-password"
import { useCompanyConfig } from "@/lib/modules/auth/hooks/use-company-config"
import { Loader2, AlertCircle } from "lucide-react"
import { useEffect } from "react"
import { setCompanyIdentifier } from "@/lib/utils/company-identifier"

export default function ForgotPasswordPage() {
  const router = useRouter()
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
    email,
    setEmail,
    touched,
    setTouched,
    isValidEmail,
    isSuccess,
  } = useForgotPassword(companyConfig?.id || "")

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
        bg-[#F8FAFC]
        text-gray-900
        [color-scheme:light]
      "
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[420px] h-[420px] bg-blue-500/10 rounded-full blur-[180px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Company Logo */}
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
              Recover your password
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Update your credentials securely for {companyConfig.legalName}.
            </p>
          </div>

          <div
            className="
              relative rounded-[28px] p-10
              bg-white
              border border-gray-200
              shadow-[0_20px_40px_-12px_rgba(2,6,23,0.15)]
            "
          >
            <form onSubmit={onSubmit} className="space-y-7">
              <FloatingInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                onBlur={() =>
                                setTouched((t) => ({ ...t, email: true }))
                              }
                hasError={!isValidEmail && touched.email}
                isSuccess={isValidEmail && touched.email}
              />                          

              {isSuccess && (
                <div
                  className="
                    rounded-xl px-4 py-3
                    bg-green-500/5 border border-green-500/20
                    text-green-700 text-sm
                  "
                >
                  We have sent a link to reset your password.
                  Please check your email and follow the instructions to complete the process.
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

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(`/${companyIdentifier}/login`)}
                  disabled={isLoading}
                  className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 flex-1"
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={!isValidEmail || isSuccess}
                  className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 flex-1"
                >
                  Send reset link
                </Button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
            Your password will be encrypted
            <br />
            using industry-standard security protocols
          </p>
        </div>
      </div>
    </div>
  )
}
