"use client"

import { useState } from "react"
import { deleteHRDocument } from "../services/hr-documents.service"
import { toast } from "sonner"

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables, options?: { onSuccess?: (data: TData) => void }) => Promise<void>
  isPending: boolean
  isError: boolean
  error: Error | null
}

export function useDeleteHRDocument(): UseMutationReturn<boolean, string> {
  const [isPending, setIsPending] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (
    id: string, 
    options?: { onSuccess?: (data: boolean) => void }
  ) => {
    setIsPending(true)
    setIsError(false)
    setError(null)

    try {
      const result = await deleteHRDocument(id)
      toast.success("HR Document deleted successfully")
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to delete HR document")
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
