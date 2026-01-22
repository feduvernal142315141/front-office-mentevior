"use client"

import { useState, useEffect, useCallback } from "react"
import { getHRDocumentById } from "../services/hr-documents.service"
import type { HRDocument } from "@/lib/types/hr-document.types"

interface UseHRDocumentByIdReturn {
  data: HRDocument | null | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useHRDocumentById(id: string | undefined): UseHRDocumentByIdReturn {
  const [data, setData] = useState<HRDocument | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDocument = useCallback(async () => {
    if (!id) {
      setData(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const document = await getHRDocumentById(id)
      setData(document)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch HR document"))
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  return {
    data,
    isLoading,
    error,
    refetch: fetchDocument,
  }
}
