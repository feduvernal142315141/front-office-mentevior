import { useState } from "react"
import { toast } from "sonner"
import type { UpdateMemberUserProfileDto } from "@/lib/types/user.types"
import { updateUserProfile } from "@/lib/modules/users/services/users.service"

export function useUpdateUserProfile() {
  const [isLoading, setIsLoading] = useState(false)

  const update = async (data: UpdateMemberUserProfileDto): Promise<boolean | null> => {
    try {
      setIsLoading(true)
      const result = await updateUserProfile(data)

      if (result) {
        toast.success("Profile updated successfully")
      }

      return Boolean(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile"
      toast.error("Failed to update profile", { description: message })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { update, isLoading }
}
