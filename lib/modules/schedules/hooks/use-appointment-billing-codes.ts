"use client"

import { useCallback, useEffect, useState } from "react"
import type { ConfigBillingCodeItem, EventType } from "@/lib/types/appointment.types"
import {
  getAppointmentBillingCodes,
  type AppointmentBillingCodeContext,
} from "../services/appointment-billing-codes.service"

interface UseAppointmentBillingCodesParams {
  context: AppointmentBillingCodeContext
  enabled?: boolean
}

interface UseAppointmentBillingCodesReturn {
  billingCodes: ConfigBillingCodeItem[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAppointmentBillingCodes({
  context,
  enabled = true,
}: UseAppointmentBillingCodesParams): UseAppointmentBillingCodesReturn {
  const [billingCodes, setBillingCodes] = useState<ConfigBillingCodeItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCodes = useCallback(async () => {
    if (!enabled) {
      setBillingCodes([])
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAppointmentBillingCodes(context)
      setBillingCodes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load billing codes"))
      setBillingCodes([])
    } finally {
      setIsLoading(false)
    }
  }, [context, enabled])

  useEffect(() => {
    void fetchCodes()
  }, [fetchCodes])

  return { billingCodes, isLoading, error, refetch: fetchCodes }
}

/** Maps frontend event type to billing codes API context */
export function eventTypeToBillingContext(eventType: EventType): AppointmentBillingCodeContext {
  return eventType === "service_plan" ? "service_plan" : "session_note"
}
