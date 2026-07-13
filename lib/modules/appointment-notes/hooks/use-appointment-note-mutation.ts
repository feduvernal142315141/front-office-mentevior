"use client"

import { useState, useCallback } from "react"
import { toast } from "@/lib/compat/sonner"
import type { UpdateAppointmentNotePayload } from "@/lib/types/appointment-note.types"
import { updateAppointmentNote } from "../services/appointment-note.service"

interface UseAppointmentNoteMutationReturn {
  update: (payload: UpdateAppointmentNotePayload) => Promise<string | null>
  isLoading: boolean
}

export function useAppointmentNoteMutation(): UseAppointmentNoteMutationReturn {
  const [isLoading, setIsLoading] = useState(false)

  const update = useCallback(async (payload: UpdateAppointmentNotePayload) => {
    try {
      setIsLoading(true)
      const id = await updateAppointmentNote(payload)
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
