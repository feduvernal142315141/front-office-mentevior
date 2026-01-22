"use client"

import { useState } from "react"
import { bulkCreateClinicalDocuments } from "../services/clinical-documents.service"
import type { BulkCreateClinicalDocumentsDto } from "@/lib/types/clinical-document.types"
import { toast } from "sonner"

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables, options?: { onSuccess?: (data: TData) => void }) => Promise<void>
  isPending: boolean
  isError: boolean
  error: Error | null
}

export function useBulkCreateClinicalDocuments(): UseMutationReturn<boolean, BulkCreateClinicalDocumentsDto> {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (
    variables: BulkCreateClinicalDocumentsDto, 
    options?: { onSuccess?: (data: boolean) => void }
  ) => {
    setIsPending(true)
    setIsError(false)
    setError(null)

    try {
      const result = await bulkCreateClinicalDocuments(variables)
      toast.success("Clinical Documents created successfully")
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create Clinical documents")
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
