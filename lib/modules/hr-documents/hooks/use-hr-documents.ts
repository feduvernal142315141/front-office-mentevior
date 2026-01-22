"use client"

import { useState, useEffect, useCallback } from "react"
import type { HRDocumentListItem } from "@/lib/types/hr-document.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getHRDocuments } from "../services/hr-documents.service"

interface UseHRDocumentsParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseHRDocumentsReturn {
  data: {
    hrDocuments: HRDocumentListItem[]
    totalCount: number
  } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useHRDocuments(initialParams?: UseHRDocumentsParams): UseHRDocumentsReturn {
  const [hrDocuments, setHRDocuments] = useState<HRDocumentListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchHRDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: initialParams?.page ?? 0,
        pageSize: initialParams?.pageSize ?? 10,
        filters: initialParams?.filters && initialParams.filters.length ? initialParams.filters : undefined,
        orders: undefined,
      }
      const data = await getHRDocuments(query)
      setHRDocuments(data.hrDocuments)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch HR documents"))
      setHRDocuments([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [initialParams?.page, initialParams?.pageSize, initialParams?.filters])

  useEffect(() => {
    fetchHRDocuments()
  }, [fetchHRDocuments])

  return {
    data: { hrDocuments, totalCount },
    isLoading,
    error,
    refetch: fetchHRDocuments,
  }
}
