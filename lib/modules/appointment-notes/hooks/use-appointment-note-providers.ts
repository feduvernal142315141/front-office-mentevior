"use client"

import { useCallback, useEffect, useState } from "react"
import type { AppointmentNoteProviderFilterOption } from "@/lib/types/appointment-note.types"
import { getAppointmentNoteProviders } from "../services/appointment-note.service"

export function useAppointmentNoteProviders() {
  const [providers, setProviders] = useState<AppointmentNoteProviderFilterOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProviders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAppointmentNoteProviders({ page: 0, pageSize: 200 })
      setProviders(result.entities)
    } catch (err) {
      setProviders([])
      setError(err instanceof Error ? err : new Error("Failed to fetch Session Note providers"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProviders()
  }, [fetchProviders])

  return { providers, isLoading, error, refetch: fetchProviders }
}
