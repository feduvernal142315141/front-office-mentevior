
import { useState, useEffect, useCallback } from "react"
import type { Role } from "@/lib/types/role.types"
import { getRoles } from "../services/roles.service"
import {QueryModel} from "@/lib/models/queryModel";

interface UseRolesParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseRolesReturn {
  roles: Role[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  refetch: (params?: UseRolesParams) => Promise<void>
}

export function useRoles(initialParams?: UseRolesParams): UseRolesReturn {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  
  // Serialize filters to string for stable comparison
  const initialPage = initialParams?.page ?? 0
  const initialPageSize = initialParams?.pageSize ?? 10
  const initialFiltersKey = JSON.stringify(initialParams?.filters ?? [])

  const fetchRoles = useCallback(async (params?: UseRolesParams) => {
    try {
      setIsLoading(true)
      setError(null)
      const page = params?.page ?? initialPage
      const pageSize = params?.pageSize ?? initialPageSize
      const filters = params?.filters ?? JSON.parse(initialFiltersKey)
      const query: QueryModel = {
        page,
        pageSize,
        filters: filters.length > 0 ? filters : undefined,
        orders: undefined,
      }
      const data = await getRoles(query)
      setRoles(data)
      // TODO: El backend debería retornar el total count
      // Por ahora asumimos que si trae menos que pageSize, es el total
      setTotalCount(data.length < pageSize ? (page * pageSize) + data.length : (page + 1) * pageSize + 1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch roles"))
      setRoles([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [initialPage, initialPageSize, initialFiltersKey])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  return {
    roles,
    isLoading,
    error,
    totalCount,
    refetch: fetchRoles,
  }
}
