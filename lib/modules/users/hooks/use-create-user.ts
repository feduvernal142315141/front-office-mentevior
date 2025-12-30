
"use client"

import { useState } from "react"
import type { CreateMemberUserDto, CreateMemberUserResponse } from "@/lib/types/user.types"
import { toast } from "sonner"
import {createUser} from "@/lib/modules/users/services/users.service";

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CreateMemberUserResponse | null>(null)

  const create = async (data: CreateMemberUserDto): Promise<CreateMemberUserResponse | null> => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await createUser(data)
      const res = { id: result ,email: data.email}
      setResponse(res)
      
      toast.success("User created successfully!", {
        description: `Welcome email sent to ${data.email}`,
      })
      
      return res
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user"
      setError(errorMessage)
      
      toast.error("Error creating user", {
        description: errorMessage,
      })
      
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setError(null)
    setResponse(null)
    setIsLoading(false)
  }

  return {
    create,
    isLoading,
    error,
    response,
    reset,
  }
}
