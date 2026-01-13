"use client"

import { useState, useEffect } from "react"
import type { Credential } from "@/lib/types/credential.types"
import { getCredentialById } from "../services/credentials.service"

interface UseCredentialByIdReturn {
  credential: Credential | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCredentialById(credentialId: string | null): UseCredentialByIdReturn {
  const [credential, setCredential] = useState<Credential | null>(null)
  const [isLoading, setIsLoading] = useState(!!credentialId)
  const [error, setError] = useState<Error | null>(null)

  const fetchCredential = async () => {
    if (!credentialId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getCredentialById(credentialId)
      setCredential(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch credential")
      setError(errorObj)
      console.error("Error fetching credential:", errorObj)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCredential()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentialId])

  return {
    credential,
    isLoading,
    error,
    refetch: fetchCredential,
  }
}
