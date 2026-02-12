"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  UserSignature,
  SaveUserSignatureDto,
} from "@/lib/types/user-credentials.types"
import {
  getSignature,
  saveSignature,
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

export function useSignature(
  memberUserId: string | null,
  enabled: boolean
): UseSignatureReturn {
  const [signature, setSignature] = useState<UserSignature | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchSignature = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      if (!memberUserId || !enabled) {
        setSignature(null)
        return
      }
      const data = await getSignature(memberUserId)
      setSignature(data)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to fetch signature")
      setError(errorObj)
    } finally {
      setIsLoading(false)
    }
  }, [memberUserId, enabled])

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      setSignature(null)
      return
    }
    fetchSignature()
  }, [fetchSignature])

  const save = async (imageBase64: string): Promise<UserSignature | null> => {
    try {
      setIsSaving(true)
      if (!memberUserId) {
        return null
      }

      const dto: SaveUserSignatureDto = {
        memberUserId,
        signature: imageBase64,
      }

      const result = await saveSignature(dto)
      if (!result) {
        await fetchSignature()
        toast.success(signature ? "Signature updated successfully." : "Digital signature saved successfully.")
        return signature
      }

      toast.success(signature ? "Signature updated successfully." : "Digital signature saved successfully.")
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
      if (!memberUserId) {
        return false
      }
      await deleteSignature(memberUserId)
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
    hasSignature: !!signature?.url,
    save,
    remove,
    refetch: fetchSignature,
  }
}
