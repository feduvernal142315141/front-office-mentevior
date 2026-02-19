"use client"

import { useState } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { encryptRsa } from "@/lib/utils/encrypt"
import { useAlert } from "@/lib/contexts/alert-context"
import { useRouter } from "next/navigation"
import { usePasswordValidation } from "../hooks/usePasswordValidation"
import { PageHeader } from "./PageHeader"
import { PasswordField } from "@/components/password/PasswordField"
import { PasswordRequirements } from "@/components/password/PasswordRequirements"
import { PasswordMismatchMessage } from "@/components/password/PasswordMismatchMessage"
import { useChangePassword } from "@/lib/modules/auth/hooks/use-change-password"
import { Button } from "@/components/custom/Button"
import { AnimatePresence } from "framer-motion"
import { PasswordMatchMessage } from "@/components/password/PasswordMatchMessage"

export default function ChangePassword() {
  const { handleChangePassword, isLoading, error } = useChangePassword()
  const { user } = useAuth()
  const alert = useAlert()
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState("")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [touched, setTouched] = useState({ current: false, new: false, confirm: false })

  const validation = usePasswordValidation(newPassword, confirmPassword)

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword

  const showMismatch =
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validation.isValid) return

    const encryptedCurrentPassword = await encryptRsa(currentPassword);
    const encryptedNewPassword = await encryptRsa(newPassword);

    const success = await handleChangePassword({
      memberUserId: user?.id ?? "",
      oldPassword: encryptedCurrentPassword,
      newPassword: encryptedNewPassword,                  
    })

    if (!success) {
      // Error is now displayed in the form error section (not via toast)
      return
    }
    alert.success("Password updated", "Your password has been changed successfully.");
    router.push("/dashboard");
  }

  return (
    <div
      className="
        min-h-screen flex relative overflow-hidden
        
        transition-colors duration-300
      "
    >

      <div
        className="
          absolute inset-0 opacity-40
          bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]

        "
      />

      <div
        className="
          absolute top-1/4 left-1/3 w-[500px] h-[500px]
          bg-blue-600/20
          rounded-full blur-[120px] animate-pulse
        "
        style={{ animationDuration: "4s" }}
      />

      <div
        className="
          absolute bottom-1/4 right-1/4 w-[400px] h-[400px]
          bg-cyan-400/20
          rounded-full blur-[100px] animate-pulse
        "
        style={{ animationDuration: "5s", animationDelay: "1s" }}
      />

      <div className="flex-1 flex justify-center p-8 lg:p-12 relative">
        <div className="
          w-full max-w-md
          animate-in fade-in slide-in-from-bottom-4 duration-700
          drop-shadow-[0_60px_80px_rgba(59,130,246,0.15)]
        ">


          <PageHeader />

          <div className="login-card-wrapper rounded-[28px] p-10">
            <div className="
              pointer-events-none
              absolute inset-0 rounded-[28px]
              ring-1 ring-white/40
            " />

              <form onSubmit={onSubmit} className="space-y-7">

              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                onBlur={() => setTouched(t => ({ ...t, current: true }))}
                placeholder="Enter your current password"
                hasError={touched.current && currentPassword.length === 0}
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                onBlur={() => setTouched(t => ({ ...t, new: true }))}
                placeholder="Enter your new password"
                hasError={touched.new && newPassword.length > 0 && !validation.isValid}
              />

              <PasswordRequirements show={newPassword.length > 0} rules={validation} />

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                placeholder="Confirm your new password"
                hasError={showMismatch}
                isSuccess={passwordsMatch}
              />

            
                <>
                  <AnimatePresence>
                    {showMismatch && <PasswordMismatchMessage />}                 

                
                    {passwordsMatch && <PasswordMatchMessage />}
                  </AnimatePresence>
                </>
            

              {error && (
                <div
                  className="
                    rounded-xl p-4
                    bg-red-100/40 text-red-700 border border-red-300  
                    
                  "
                >
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  disabled={isLoading}
                  className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading || !validation.isValid}
                  loading={isLoading}
                  className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 flex-1"
                >
                  Save Password
                </Button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs mt-6 leading-relaxed 
            text-gray-600
          ">
            Your password will be encrypted
            <br />
            <span className="text-gray-500">
              using industry-standard protocols
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
