"use client"

import { useState, useEffect, useCallback } from "react"
import type { CredentialListItem } from "@/lib/types/credential.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getCredentials } from "../services/credentials.service"

interface UseCredentialsParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseCredentialsReturn {
  credentials: CredentialListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (params?: UseCredentialsParams) => Promise<void>
}

export function useCredentials(initialParams?: UseCredentialsParams): UseCredentialsReturn {
  const [credentials, setCredentials] = useState<CredentialListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCredentials = useCallback(async (params?: UseCredentialsParams) => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getCredentials(query)
      setCredentials(data.credentials)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch credentials"))
      setCredentials([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredentials(initialParams)
  }, []) 

  return {
    credentials,
    totalCount,
    isLoading,
    error,
    refetch: fetchCredentials,
  }
}
