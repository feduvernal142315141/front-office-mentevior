"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { CredentialCatalogItem } from "@/lib/types/credential.types"
import { getCredentialsCatalog } from "../services/credentials.service"

interface UseCredentialsCatalogReturn {
  catalogCredentials: CredentialCatalogItem[]
  allCatalogCredentials: CredentialCatalogItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  filterCredentials: (searchTerm: string) => void
}

export function useCredentialsCatalog(): UseCredentialsCatalogReturn {
  const [allCatalogCredentials, setAllCatalogCredentials] = useState<CredentialCatalogItem[]>([])
  const [filteredCredentials, setFilteredCredentials] = useState<CredentialCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAllCredentials = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getCredentialsCatalog()
        setAllCatalogCredentials(data.catalogCredentials)
        setFilteredCredentials(data.catalogCredentials)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch catalog"))
        setAllCatalogCredentials([])
        setFilteredCredentials([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllCredentials()
  }, [])

  const filterCredentials = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredCredentials(allCatalogCredentials)
      return
    }

    const filtered = allCatalogCredentials.filter((credential) => {
      const matchesSearch = 
        credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credential.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (credential.description && credential.description.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })

    setFilteredCredentials(filtered)
  }, [allCatalogCredentials])

  const totalCount = useMemo(() => filteredCredentials.length, [filteredCredentials])

  return {
    catalogCredentials: filteredCredentials,
    allCatalogCredentials,
    totalCount,
    isLoading,
    error,
    filterCredentials,
  }
}
