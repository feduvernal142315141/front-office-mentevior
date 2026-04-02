"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteRole } from "../services/roles.service"

interface UseDeleteRoleReturn {
  remove: (roleId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useDeleteRole(): UseDeleteRoleReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async (roleId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await deleteRole(roleId)
      toast.success("Role deleted successfully")
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete role"
      setError(message)
      toast.error("Error deleting role", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { remove, isLoading, error }
}
