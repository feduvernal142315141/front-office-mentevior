"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  UserSignature,
  CreateUserSignatureDto,
  UpdateUserSignatureDto,
} from "@/lib/types/user-credentials.types"
import {
  getSignature,
  createSignature,
  updateSignature,
  deleteSignature,
} from "../services/signature.service"
import { toast } from "sonner"

interface UseSignatureReturn {
  signature: UserSignature | null
  isLoading: boolean
  error: Error | null
  isSaving: boolean
  isDeleting: boolean
  hasSignature: boolean
  save: (imageBase64: string) => Promise<UserSignature | null>
  remove: () => Promise<boolean>
  refetch: () => Promise<void>
}

export function useSignature(): UseSignatureReturn {
  const [signature, setSignature] = useState<UserSignature | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSignature = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getSignature()
      setSignature(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch signature")
      setError(errorObj)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSignature()
  }, [fetchSignature])

  const save = async (imageBase64: string): Promise<UserSignature | null> => {
    try {
      setIsSaving(true)

      let result: UserSignature

      if (signature) {
        const dto: UpdateUserSignatureDto = { imageBase64 }
        result = await updateSignature(dto)
        toast.success("Signature updated successfully.")
      } else {
        const dto: CreateUserSignatureDto = { imageBase64 }
        result = await createSignature(dto)
        toast.success("Digital signature saved successfully.")
      }

      setSignature(result)
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to save signature")
      toast.error(errorObj.message)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async (): Promise<boolean> => {
    try {
      setIsDeleting(true)
      await deleteSignature()
      setSignature(null)
      toast.success("Signature removed successfully.")
      return true
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to delete signature")
      toast.error(errorObj.message)
      return false
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    signature,
    isLoading,
    error,
    isSaving,
    isDeleting,
    hasSignature: !!signature,
    save,
    remove,
    refetch: fetchSignature,
  }
}
