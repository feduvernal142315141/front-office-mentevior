
import { useState } from "react"
import { toast } from "sonner"
import type { UpdateMemberUserDto, MemberUser } from "@/lib/types/user.types"
import { updateUser } from "../services/users.service.mock"

interface UseUpdateUserReturn {
  update: (userId: string, data: UpdateMemberUserDto) => Promise<MemberUser | null>
  isLoading: boolean

  error: Error | null

  updatedUser: MemberUser | null

  reset: () => void
}

export function useUpdateUser(): UseUpdateUserReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [updatedUser, setUpdatedUser] = useState<MemberUser | null>(null)

  const update = async (
    userId: string,
    data: UpdateMemberUserDto
  ): Promise<MemberUser | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateUser(userId, data)
      setUpdatedUser(result)

      toast.success("User updated successfully", {
        description: `${result.firstName} ${result.lastName} has been updated.`,
      })

      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Failed to update user")
      setError(errorObj)
      setUpdatedUser(null)

      toast.error("Failed to update user", {
        description: errorObj.message,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setIsLoading(false)
    setError(null)
    setUpdatedUser(null)
  }

  return {
    update,
    isLoading,
    error,
    updatedUser,
    reset,
  }
}
