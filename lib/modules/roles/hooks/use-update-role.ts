
import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { UpdateRoleDto, Role } from "@/lib/types/role.types"
import { updateRole } from "../services/roles.service"

interface UseUpdateRoleReturn {

  update: (roleId: string, data: UpdateRoleDto) => Promise<Role | null>

  isLoading: boolean

  error: Error | null

  updatedRole: Role | null

  reset: () => void
}

export function useUpdateRole(): UseUpdateRoleReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [updatedRole, setUpdatedRole] = useState<Role | null>(null)

  const update = useCallback(async (
    roleId: string,
    data: UpdateRoleDto
  ): Promise<Role | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateRole(roleId, data)
      setUpdatedRole(result)
      const inputName = data.name?.trim() || ""
      const roleName = inputName || result.name.trim() || "The role"

      toast.success("Role updated successfully", {
        description: `${roleName} has been updated.`,
      })

      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update role")
      setError(errorObj)
      setUpdatedRole(null)

      toast.error("Failed to update role", {
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
    setUpdatedRole(null)
  }, [])

  return {
    update,
    isLoading,
    error,
    updatedRole,
    reset,
  }
}
