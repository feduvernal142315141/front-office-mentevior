"use client"

import { useState } from "react"
import { bulkCreateHRDocuments } from "../services/hr-documents.service"
import type { BulkCreateHRDocumentsDto } from "@/lib/types/hr-document.types"
import { toast } from "sonner"

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables, options?: { onSuccess?: (data: TData) => void }) => Promise<void>
  isPending: boolean
  isError: boolean
  error: Error | null
}

export function useBulkCreateHRDocuments(): UseMutationReturn<boolean, BulkCreateHRDocumentsDto> {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (
    variables: BulkCreateHRDocumentsDto, 
    options?: { onSuccess?: (data: boolean) => void }
  ) => {
    setIsPending(true)
    setIsError(false)
    setError(null)

    try {
      const result = await bulkCreateHRDocuments(variables)
      toast.success("HR Documents created successfully")
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create HR documents")
      setIsError(true)
      setError(errorObj)
      toast.error(errorObj.message)
      throw errorObj
    } finally {
      setIsPending(false)
    }
  }

  return {
    mutate,
    isPending,
    isError,
    error,
  }
}
