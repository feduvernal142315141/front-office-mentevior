/**
 * USE ACCOUNT PROFILE
 * 
 * Hook to fetch account profile data.
 * This data comes from BO when company is created.
 */

"use client"

import { useState, useEffect } from "react"
import type { AccountProfile } from "@/lib/types/account-profile.types"
import { getAccountProfile } from "../services/account-profile.service"

interface UseAccountProfileReturn {
  accountProfile: AccountProfile | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAccountProfile(): UseAccountProfileReturn {
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAccountProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAccountProfile()
      setAccountProfile(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch account profile")
      setError(errorObj)
      console.error("Error fetching account profile:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccountProfile()
  }, [])

  return {
    accountProfile,
    isLoading,
    error,
    refetch: fetchAccountProfile,
  }
}
