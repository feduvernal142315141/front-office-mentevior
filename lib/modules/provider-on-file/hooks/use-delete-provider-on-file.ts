"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { deleteProviderOnFile } from "../services/provider-on-file.service"

interface UseDeleteProviderOnFileReturn {
  remove: (id: string) => Promise<boolean>
  isDeleting: boolean
}

export function useDeleteProviderOnFile(): UseDeleteProviderOnFileReturn {
  const [isDeleting, setIsDeleting] = useState(false)

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true)
    try {
      await deleteProviderOnFile(id)
      toast.success("Provider removed")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove provider"
      toast.error("Error removing provider", { description: message })
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return { remove, isDeleting }
}
