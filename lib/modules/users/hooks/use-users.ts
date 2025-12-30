
import { useState, useEffect, useCallback } from "react"
import { MemberUserListItem} from "@/lib/types/user.types"
import {getUsers} from "@/lib/modules/users/services/users.service";
import {QueryModel} from "@/lib/models/queryModel";

interface UseUsersReturn {
  users: MemberUserListItem[]
  isLoading: boolean
  error: Error | null
  refetch: (filters?: string[]) => Promise<void>
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<MemberUserListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async (filters: string[] = []) => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: 0,
        pageSize: 10,
        filters: filters.length ? filters : undefined,
        orders: undefined,
      }
      const data = await getUsers(query)
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch users"))
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
  }
}
