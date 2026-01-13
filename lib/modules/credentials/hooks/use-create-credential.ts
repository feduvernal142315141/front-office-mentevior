
"use client"

import { useState } from "react"
import { createCredential } from "../services/credentials.service"
import type { CreateCredentialDto } from "@/lib/types/credential.types"
import { toast } from "sonner"

interface UseCreateCredentialReturn {
  create: (data: CreateCredentialDto) => Promise<string | null>
  isLoading: boolean
  error: Error | null
}

export function useCreateCredential(): UseCreateCredentialReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: CreateCredentialDto): Promise<string | null> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const id = await createCredential(data)
      
      toast.success("Credential added successfully", {
        description: `${data.name} has been added to your organization`,
      })
      
      return id
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create credential")
      setError(errorObj)
      toast.error("Failed to add credential", {
        description: errorObj.message,
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    create,
    isLoading,
    error,
  }
}
