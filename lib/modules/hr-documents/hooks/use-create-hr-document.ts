"use client"

import { useState } from "react"
import { createHRDocument } from "../services/hr-documents.service"
import type { CreateHRDocumentDto } from "@/lib/types/hr-document.types"
import { toast } from "sonner"

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables, options?: { onSuccess?: (data: TData) => void }) => Promise<void>
  isPending: boolean
  isError: boolean
  error: Error | null
}

export function useCreateHRDocument(): UseMutationReturn<string, CreateHRDocumentDto> {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (
    variables: CreateHRDocumentDto, 
    options?: { onSuccess?: (data: string) => void }
  ) => {
    setIsPending(true)
    setIsError(false)
    setError(null)

    try {
      const result = await createHRDocument(variables)
      toast.success("HR Document created successfully")
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create HR document")
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
