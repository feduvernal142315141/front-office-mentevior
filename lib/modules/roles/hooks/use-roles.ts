
import { useState, useEffect, useCallback } from "react"
import type { Role } from "@/lib/types/role.types"
import { getRoles } from "../services/roles.service"
import {QueryModel} from "@/lib/models/queryModel";

interface UseRolesReturn {
  roles: Role[]
  isLoading: boolean
  error: Error | null
  refetch: (filters?: string[]) => Promise<void>
}

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRoles = useCallback(async (filters: string[] = []) => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: 0,
        pageSize: 10,
        filters: filters.length ? filters : undefined,
        orders: undefined,
      }
      const data = await getRoles(query)
      setRoles(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch roles"))
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  return {
    roles,
    isLoading,
    error,
    refetch: fetchRoles,
  }
}
