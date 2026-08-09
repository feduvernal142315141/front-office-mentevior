"use client"

import { useCallback, useEffect, useState } from "react"
import { isReportMonth } from "@/lib/utils/report-month"
import type { CaseSupervisionPreparation } from "@/lib/types/case-supervision-log.types"
import { getCaseSupervisionAppointments } from "../services/case-supervision-log.service"

interface UseCaseSupervisionAppointmentsParams {
  clientId: string
  providerId: string
  /** `yyyyMM` */
  reportMonth: string
}

interface UseCaseSupervisionAppointmentsReturn {
  preparation: CaseSupervisionPreparation | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Los appointments del período para el trío elegido.
 *
 * Se dispara sólo con los tres valores completos: pedir con el mes a medio
 * elegir devolvería un conjunto que no significa nada y haría parpadear la
 * pantalla mientras el usuario todavía está decidiendo.
 */
export function useCaseSupervisionAppointments({
  clientId,
  providerId,
  reportMonth,
}: UseCaseSupervisionAppointmentsParams): UseCaseSupervisionAppointmentsReturn {
  const [preparation, setPreparation] = useState<CaseSupervisionPreparation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const isReady = !!clientId && !!providerId && isReportMonth(reportMonth)

  const fetchPreparation = useCallback(async () => {
    if (!isReady) {
      setPreparation(null)
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await getCaseSupervisionAppointments({ clientId, providerId, reportMonth })
      setPreparation(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load supervision appointments"))
      setPreparation(null)
    } finally {
      setIsLoading(false)
    }
  }, [isReady, clientId, providerId, reportMonth])

  useEffect(() => {
    void fetchPreparation()
  }, [fetchPreparation])

  return { preparation, isLoading, error, refetch: fetchPreparation }
}
