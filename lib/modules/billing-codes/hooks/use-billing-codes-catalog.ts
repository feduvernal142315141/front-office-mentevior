"use client"

import { useState, useCallback } from "react"
import type { BillingCodeCatalogItem } from "@/lib/types/billing-code.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getBillingCodesCatalog } from "../services/billing-codes.service"
import { FilterOperator } from "@/lib/models/filterOperator"

interface UseBillingCodesCatalogReturn {
  catalogCodes: BillingCodeCatalogItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  search: (searchTerm: string, type?: string) => Promise<void>
  clear: () => void
}

export function useBillingCodesCatalog(): UseBillingCodesCatalogReturn {
  const [catalogCodes, setCatalogCodes] = useState<BillingCodeCatalogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const search = useCallback(async (searchTerm: string, type?: string) => {
    if (!searchTerm.trim() && !type) {
      setCatalogCodes([])
      setTotalCount(0)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const filters: string[] = []
      
      if (searchTerm.trim()) {
        filters.push(`code__CONTAINS_IGNORE_CASE__${searchTerm}__OR`)
        filters.push(`description__CONTAINS_IGNORE_CASE__${searchTerm}__AND`)
      }
      
      if (type && type !== "all") {
        filters.push(`typeCatalog.name__${FilterOperator.relatedContains}__${type}__AND`)
      }
      
      const query: QueryModel = {
        page: 0,
        pageSize: 100, 
        filters: filters.length > 0 ? filters : undefined,
      }
      
      const data = await getBillingCodesCatalog(query)
      setCatalogCodes(data.catalogCodes)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to search catalog"))
      setCatalogCodes([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setCatalogCodes([])
    setTotalCount(0)
    setError(null)
  }, [])

  return {
    catalogCodes,
    totalCount,
    isLoading,
    error,
    search,
    clear,
  }
}
