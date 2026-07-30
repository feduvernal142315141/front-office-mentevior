"use client"

import { useState, useEffect, useCallback } from "react"
import type { AppointmentNote97156 } from "@/lib/types/appointment-note-97156.types"
import { getAppointmentNote97156 } from "../services/appointment-note-97156.service"

interface UseAppointmentNote97156Return {
  note: AppointmentNote97156 | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAppointmentNote97156(appointmentId: string | null): UseAppointmentNote97156Return {
  const [note, setNote] = useState<AppointmentNote97156 | null>(null)
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
      const data = await getAppointmentNote97156(appointmentId)
      setNote(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch 97156 appointment note"))
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    void fetchNote()
  }, [fetchNote])

  return { note, isLoading, error, refetch: fetchNote }
}
