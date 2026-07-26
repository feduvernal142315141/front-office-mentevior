"use client"

import { useState, useEffect, useCallback } from "react"
import type { AppointmentNote97155 } from "@/lib/types/appointment-note-97155.types"
import { getAppointmentNote97155 } from "../services/appointment-note-97155.service"

interface UseAppointmentNote97155Return {
  note: AppointmentNote97155 | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAppointmentNote97155(appointmentId: string | null): UseAppointmentNote97155Return {
  const [note, setNote] = useState<AppointmentNote97155 | null>(null)
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
      const data = await getAppointmentNote97155(appointmentId)
      setNote(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch 97155 appointment note"))
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    void fetchNote()
  }, [fetchNote])

  return { note, isLoading, error, refetch: fetchNote }
}
