"use client"

import { useState } from "react"
import { updateCredential } from "../services/credentials.service"
import type { UpdateCredentialDto } from "@/lib/types/credential.types"
import { toast } from "sonner"

interface UseUpdateCredentialReturn {
  update: (data: UpdateCredentialDto) => Promise<boolean>
  isLoading: boolean
  error: Error | null
}

export function useUpdateCredential(): UseUpdateCredentialReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (data: UpdateCredentialDto): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      
      await updateCredential(data)
      
      toast.success("Credential updated successfully", {
        description: `${data.name} has been updated`,
      })
      
      return true
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update credential")
      setError(errorObj)
      toast.error("Failed to update credential", {
        description: errorObj.message,
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    update,
    isLoading,
    error,
  }
}
