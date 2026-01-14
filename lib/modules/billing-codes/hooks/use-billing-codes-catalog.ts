"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { BillingCodeCatalogItem } from "@/lib/types/billing-code.types"
import { getBillingCodesCatalog } from "../services/billing-codes.service"

interface UseBillingCodesCatalogReturn {
  catalogCodes: BillingCodeCatalogItem[]
  allCatalogCodes: BillingCodeCatalogItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  filterCodes: (searchTerm: string, type?: string) => void
}

export function useBillingCodesCatalog(): UseBillingCodesCatalogReturn {
  const [allCatalogCodes, setAllCatalogCodes] = useState<BillingCodeCatalogItem[]>([])
  const [filteredCodes, setFilteredCodes] = useState<BillingCodeCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)


  useEffect(() => {
    const fetchAllCodes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getBillingCodesCatalog()
        setAllCatalogCodes(data.catalogCodes)
        setFilteredCodes(data.catalogCodes)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch catalog"))
        setAllCatalogCodes([])
        setFilteredCodes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllCodes()
  }, [])


  const filterCodes = useCallback((searchTerm: string, type?: string) => {
    if (!searchTerm.trim() && (!type || type === "all")) {
      setFilteredCodes(allCatalogCodes)
      return
    }

    const filtered = allCatalogCodes.filter((code) => {

      const matchesType = !type || type === "all" || code.type === type


      const matchesSearch = !searchTerm.trim() || 
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.description.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesType && matchesSearch
    })

    setFilteredCodes(filtered)
  }, [allCatalogCodes])

  const totalCount = useMemo(() => filteredCodes.length, [filteredCodes])

  return {
    catalogCodes: filteredCodes,
    allCatalogCodes,
    totalCount,
    isLoading,
    error,
    filterCodes,
  }
}
