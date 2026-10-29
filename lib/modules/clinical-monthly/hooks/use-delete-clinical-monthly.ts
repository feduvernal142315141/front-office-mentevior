"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteClinicalMonthly } from "../services/clinical-monthly.service"

export function useDeleteClinicalMonthly() {
  const [isDeleting, setIsDeleting] = useState(false)

  const mutate = async (id: string, onSuccess?: () => void) => {
    setIsDeleting(true)
    try {
      await deleteClinicalMonthly(id)
      toast.success("Clinical Monthly deleted successfully")
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete clinical monthly"
      toast.error(message)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }

  return { mutate, isDeleting }
}
