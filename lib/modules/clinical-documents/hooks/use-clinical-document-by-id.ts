"use client"

import { useState, useEffect, useCallback } from "react"
import { getClinicalDocumentById } from "../services/clinical-documents.service"
import type { ClinicalDocument } from "@/lib/types/clinical-document.types"

interface UseClinicalDocumentByIdReturn {
  data: ClinicalDocument | null | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClinicalDocumentById(id: string | undefined): UseClinicalDocumentByIdReturn {
  const [data, setData] = useState<ClinicalDocument | null | undefined>(undefined)
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
      const document = await getClinicalDocumentById(id)
      setData(document)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch Clinical document"))
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
