
import { useState, useEffect } from "react"
import type { MemberUser } from "@/lib/types/user.types"
import { getUserById } from "../services/users.service.mock"

interface UseUserByIdReturn {

  user: MemberUser | null

  isLoading: boolean

  error: Error | null

  refetch: () => void
}

export function useUserById(userId: string | null): UseUserByIdReturn {
  const [user, setUser] = useState<MemberUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = async () => {
    if (!userId) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getUserById(userId)
      
      if (!data) {
        throw new Error("User not found")
      }
      
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user"))
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  }
}
