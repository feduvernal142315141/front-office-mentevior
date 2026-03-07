"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { AssignClientPhysicianDto } from "@/lib/types/client-physician.types"
import { assignClientPhysician } from "../services/client-physicians.service"

interface UseAssignClientPhysicianReturn {
  assign: (data: AssignClientPhysicianDto) => Promise<boolean>
  assignMany: (clientId: string, physicianIds: string[]) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

export function useAssignClientPhysician(): UseAssignClientPhysicianReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assign = async (data: AssignClientPhysicianDto): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await assignClientPhysician(data)
      toast.success("Physician assigned successfully")
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign physician"
      setError(message)
      toast.error("Error assigning physician", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const assignMany = async (clientId: string, physicianIds: string[]): Promise<boolean> => {
    if (!physicianIds.length) return false
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all(physicianIds.map((physicianId) => assignClientPhysician({ clientId, physicianId })))
      toast.success(
        physicianIds.length === 1
          ? "Physician assigned successfully"
          : `${physicianIds.length} physicians assigned successfully`
      )
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to assign physicians"
      setError(message)
      toast.error("Error assigning physicians", { description: message })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { assign, assignMany, isLoading, error }
}
