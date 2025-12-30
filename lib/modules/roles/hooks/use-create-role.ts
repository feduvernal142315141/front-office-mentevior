import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { CreateRoleDto, Role } from "@/lib/types/role.types"
import { createRole } from "../services/roles.service"

interface UseCreateRoleReturn {

  create: (data: CreateRoleDto) => Promise<Role | null>

  isLoading: boolean

  error: Error | null

  createdRole: Role | null

  reset: () => void
}

export function useCreateRole(): UseCreateRoleReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [createdRole, setCreatedRole] = useState<Role | null>(null)

  const create = useCallback(async (data: CreateRoleDto): Promise<Role | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await createRole(data)
      setCreatedRole(result)

      toast.success("Role created successfully", {
        description: `${result.name} has been created.`,
      })

      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to create role")
      setError(errorObj)
      setCreatedRole(null)

      toast.error("Failed to create role", {
        description: errorObj.message,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setCreatedRole(null)
  }, [])

  return {
    create,
    isLoading,
    error,
    createdRole,
    reset,
  }
}
