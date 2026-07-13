"use client"

import { useState, useEffect, useCallback } from "react"
import type { AppointmentNote } from "@/lib/types/appointment-note.types"
import { getAppointmentNote } from "../services/appointment-note.service"

interface UseAppointmentNoteReturn {
  note: AppointmentNote | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAppointmentNote(appointmentId: string | null): UseAppointmentNoteReturn {
  const [note, setNote] = useState<AppointmentNote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchNote = useCallback(async () => {
    if (!appointmentId) {
      setNote(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointmentNote(appointmentId)
      setNote(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch appointment note"))
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    void fetchNote()
  }, [fetchNote])

  return { note, isLoading, error, refetch: fetchNote }
}
