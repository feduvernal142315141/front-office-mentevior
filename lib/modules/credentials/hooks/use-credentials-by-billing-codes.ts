"use client"

import { useState, useCallback, useRef } from "react"
import type { CredentialCatalogItem } from "@/lib/types/credential.types"
import { getCredentialsByBillingCodes } from "../services/credentials.service"

interface UseCredentialsByBillingCodesReturn {
  credentials: CredentialCatalogItem[]
  isLoading: boolean
  error: Error | null
  /** Call this when the credentials dropdown opens — fetches only if billing codes changed */
  fetchCredentials: (billingCodeIds: string[]) => Promise<void>
  /** Reset state when billing codes are cleared */
  reset: () => void
}

export function useCredentialsByBillingCodes(): UseCredentialsByBillingCodesReturn {
  const [credentials, setCredentials] = useState<CredentialCatalogItem[]>([])
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState<Error | null>(null)

  // tracks the last fetched key to avoid redundant requests
  const lastFetchedKeyRef = useRef<string>("")

  const fetchCredentials = useCallback(async (billingCodeIds: string[]) => {
    if (!billingCodeIds.length) return

    const key = [...billingCodeIds].sort().join(",")

    // skip fetch if billing codes haven't changed since last fetch
    if (key === lastFetchedKeyRef.current) return
    lastFetchedKeyRef.current = key

    try {
      setIsLoading(true)
      setError(null)
      const data = await getCredentialsByBillingCodes(billingCodeIds)
      setCredentials(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch credentials"))
      setCredentials([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setCredentials([])
    setError(null)
    lastFetchedKeyRef.current = ""
  }, [])

  return { credentials, isLoading, error, fetchCredentials, reset }
}
