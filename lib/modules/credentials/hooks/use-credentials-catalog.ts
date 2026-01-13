"use client"

import { useState, useCallback } from "react"
import type { CredentialCatalogItem } from "@/lib/types/credential.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getCredentialsCatalog } from "../services/credentials.service"

interface UseCredentialsCatalogReturn {
  catalogCredentials: CredentialCatalogItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  search: (searchTerm: string) => Promise<void>
  clear: () => void
}

export function useCredentialsCatalog(): UseCredentialsCatalogReturn {
  const [catalogCredentials, setCatalogCredentials] = useState<CredentialCatalogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCatalogCredentials([])
      setTotalCount(0)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const filters: string[] = []
      
      if (searchTerm.trim()) {
        filters.push(`name__CONTAINS_IGNORE_CASE__${searchTerm}__OR`)
        filters.push(`shortName__CONTAINS_IGNORE_CASE__${searchTerm}__OR`)
        filters.push(`description__CONTAINS_IGNORE_CASE__${searchTerm}__AND`)
      }
      
      const query: QueryModel = {
        page: 0,
        pageSize: 100, 
        filters: filters.length > 0 ? filters : undefined,
      }
      
      const data = await getCredentialsCatalog(query)
      setCatalogCredentials(data.catalogCredentials)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to search catalog"))
      setCatalogCredentials([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setCatalogCredentials([])
    setTotalCount(0)
    setError(null)
  }, [])

  return {
    catalogCredentials,
    totalCount,
    isLoading,
    error,
    search,
    clear,
  }
}
