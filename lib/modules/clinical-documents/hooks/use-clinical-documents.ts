"use client"

import { useState, useEffect, useCallback } from "react"
import type { ClinicalDocumentListItem } from "@/lib/types/clinical-document.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getClinicalDocuments } from "../services/clinical-documents.service"

interface UseClinicalDocumentsParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseClinicalDocumentsReturn {
  data: {
    clinicalDocuments: ClinicalDocumentListItem[]
    totalCount: number
  } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClinicalDocuments(initialParams?: UseClinicalDocumentsParams): UseClinicalDocumentsReturn {
  const [clinicalDocuments, setClinicalDocuments] = useState<ClinicalDocumentListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchClinicalDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: initialParams?.page ?? 0,
        pageSize: initialParams?.pageSize ?? 10,
        filters: initialParams?.filters && initialParams.filters.length ? initialParams.filters : undefined,
        orders: undefined,
      }
      const data = await getClinicalDocuments(query)
      setClinicalDocuments(data.clinicalDocuments)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch Clinical documents"))
      setClinicalDocuments([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [initialParams?.page, initialParams?.pageSize, initialParams?.filters])

  useEffect(() => {
    fetchClinicalDocuments()
  }, [fetchClinicalDocuments])

  return {
    data: { clinicalDocuments, totalCount },
    isLoading,
    error,
    refetch: fetchClinicalDocuments,
  }
}
