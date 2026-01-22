"use client"

import { useState, useEffect, useCallback } from "react"
import { getHRDocumentsCatalog } from "../services/hr-documents.service"
import type { DocumentCategory, HRDocumentCatalogItem } from "@/lib/types/hr-document.types"

interface UseHRDocumentsCatalogReturn {
  data: {
    catalogDocuments: HRDocumentCatalogItem[]
    totalCount: number
  } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useHRDocumentsCatalog(documentCategory: DocumentCategory = "HR"): UseHRDocumentsCatalogReturn {
  const [catalogDocuments, setCatalogDocuments] = useState<HRDocumentCatalogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getHRDocumentsCatalog(documentCategory)
      setCatalogDocuments(data.catalogDocuments)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch HR documents catalog"))
      setCatalogDocuments([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [documentCategory])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  return {
    data: { catalogDocuments, totalCount },
    isLoading,
    error,
    refetch: fetchCatalog,
  }
}
