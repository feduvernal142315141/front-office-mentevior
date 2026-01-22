"use client"

import { useState, useEffect, useCallback } from "react"
import { getClinicalDocumentsCatalog } from "../services/clinical-documents.service"
import type { DocumentCategory, ClinicalDocumentCatalogItem } from "@/lib/types/clinical-document.types"

interface UseClinicalDocumentsCatalogReturn {
  data: {
    catalogDocuments: ClinicalDocumentCatalogItem[]
    totalCount: number
  } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClinicalDocumentsCatalog(documentCategory: DocumentCategory = "CLINICAL"): UseClinicalDocumentsCatalogReturn {
  const [catalogDocuments, setCatalogDocuments] = useState<ClinicalDocumentCatalogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getClinicalDocumentsCatalog(documentCategory)
      setCatalogDocuments(data.catalogDocuments)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch Clinical documents catalog"))
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
