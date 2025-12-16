"use client"

import { RequestUpdatePassword } from "@/lib/models/change-password/change-password"
import { serviceUpdatePassword } from "@/lib/services/change-password/change-password"
import { useState } from "react"

export function useChangePassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async (payload: RequestUpdatePassword) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await serviceUpdatePassword(payload)

      if (!response || response.status !== 200) {
        // Extract error message from backend response
        const errorMessage = response?.data?.errorResponse?.message || "Error updating password"
        setError(errorMessage)
        return false
      }

      setSuccess(true)
      return true
    } catch (err: any) {
      console.error("Change password error:", err)
      // Extract error message from axios error response
      const errorMessage = err?.response?.data?.errorResponse?.message || "Unexpected error updating password"
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleChangePassword,
    isLoading,
    error,
    success,
  }
}
