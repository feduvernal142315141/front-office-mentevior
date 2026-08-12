"use client"

import { useCallback, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import { improveAppointmentNoteSummary } from "../services/appointment-note-ai-summary.service"
import type { ImproveAppointmentNoteSummaryPayload } from "@/lib/types/appointment-note-ai-summary.types"

export function useImproveAppointmentNoteSummary() {
  const [isLoading, setIsLoading] = useState(false)

  const improve = useCallback(async (payload: ImproveAppointmentNoteSummaryPayload) => {
    try {
      setIsLoading(true)
      return await improveAppointmentNoteSummary(payload)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to improve summary"
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { improve, isLoading }
}
