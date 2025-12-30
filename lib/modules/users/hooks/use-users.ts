
import { useState, useEffect, useCallback } from "react"
import { MemberUserListItem} from "@/lib/types/user.types"
import {getUsers} from "@/lib/modules/users/services/users.service";
import {QueryModel} from "@/lib/models/queryModel";

interface UseUsersParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseUsersReturn {
  users: MemberUserListItem[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  refetch: (params?: UseUsersParams) => Promise<void>
}

export function useUsers(initialParams?: UseUsersParams): UseUsersReturn {
  const [users, setUsers] = useState<MemberUserListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async (params?: UseUsersParams) => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getUsers(query)
      setUsers(data.users)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch users"))
      setUsers([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(initialParams)
  }, []) // No dependencies - solo fetch inicial

  return {
    users,
    isLoading,
    error,
    totalCount,
    refetch: fetchUsers,
  }
}
