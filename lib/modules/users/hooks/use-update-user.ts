
import { useState } from "react"
import { toast } from "sonner"
import type { UpdateMemberUserDto } from "@/lib/types/user.types"
import {updateUser} from "@/lib/modules/users/services/users.service";

interface UseUpdateUserReturn {
  update: (data: UpdateMemberUserDto) => Promise<Boolean | null>
  isLoading: boolean

  error: Error | null

  updatedUser: Boolean | null

  reset: () => void
}

export function useUpdateUser(): UseUpdateUserReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [updatedUser, setUpdatedUser] = useState<Boolean | null>(null)

  const update = async (
    data: UpdateMemberUserDto
  ): Promise<Boolean | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await updateUser(data)
      setUpdatedUser(result)

      toast.success("User updated successfully", {
        description: `${data.firstName} ${data.lastName} has been updated.`,
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
