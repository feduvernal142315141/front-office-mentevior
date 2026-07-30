"use client"

import { useState, useCallback } from "react"
import { toast } from "@/lib/compat/sonner"
import type { UpdateAppointmentNote97156Payload } from "@/lib/types/appointment-note-97156.types"
import { updateAppointmentNote97156 } from "../services/appointment-note-97156.service"

interface UseAppointmentNote97156MutationReturn {
  update: (payload: UpdateAppointmentNote97156Payload) => Promise<string | null>
  isLoading: boolean
}

export function useAppointmentNote97156Mutation(): UseAppointmentNote97156MutationReturn {
  const [isLoading, setIsLoading] = useState(false)

  const update = useCallback(async (payload: UpdateAppointmentNote97156Payload) => {
    try {
      setIsLoading(true)
      const id = await updateAppointmentNote97156(payload)
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
