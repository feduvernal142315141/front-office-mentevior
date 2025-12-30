
import { useState, useEffect, useCallback } from "react"
import { MemberUser } from "@/lib/types/user.types"
import { getUsers } from "../services/users.service.mock"

interface UseUsersReturn {
  users: MemberUser[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<MemberUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getUsers()
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
