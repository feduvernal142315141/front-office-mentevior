"use client"

import { useState, useCallback } from "react"
import { toast } from "@/lib/compat/sonner"
import type { UpdateAppointmentNote97155Payload } from "@/lib/types/appointment-note-97155.types"
import { updateAppointmentNote97155 } from "../services/appointment-note-97155.service"

interface UseAppointmentNote97155MutationReturn {
  update: (payload: UpdateAppointmentNote97155Payload) => Promise<string | null>
  isLoading: boolean
}

export function useAppointmentNote97155Mutation(): UseAppointmentNote97155MutationReturn {
  const [isLoading, setIsLoading] = useState(false)

  const update = useCallback(async (payload: UpdateAppointmentNote97155Payload) => {
    try {
      setIsLoading(true)
      const id = await updateAppointmentNote97155(payload)
      toast.success("Session note saved successfully")
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save session note"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { update, isLoading }
}
