"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { useForgotPassword } from "@/lib/modules/auth/hooks/use-forgot-password"

export default function ForgotPasswordPage() {
  const router = useRouter()

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
  } = useForgotPassword()

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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Recover your password
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Update your credentials securely.
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
                  onClick={() => router.push("/login")}
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
