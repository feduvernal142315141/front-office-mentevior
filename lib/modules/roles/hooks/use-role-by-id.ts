import { useState, useEffect } from "react"
import type { RoleWithUsage } from "@/lib/types/role.types"
import { getRoleById } from "../services/roles.service"

interface UseRoleByIdReturn {

  role: RoleWithUsage | null

  isLoading: boolean

  error: Error | null

  refetch: () => void
}

export function useRoleById(roleId: string | null): UseRoleByIdReturn {
  const [role, setRole] = useState<RoleWithUsage | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchRole = async () => {
    if (!roleId) {
      setRole(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getRoleById(roleId)
      
      if (!data) {
        throw new Error("Role not found")
      }
      
      setRole(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch role"))
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRole()
  }, [roleId])

  return {
    role,
    isLoading,
    error,
    refetch: fetchRole,
  }
}
