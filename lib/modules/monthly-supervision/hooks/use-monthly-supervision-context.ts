"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MonthlySupervisionContext } from "@/lib/types/monthly-supervision.types"
import {
  getMonthlySupervisionById,
  getSupervisionAppointments,
} from "../services/monthly-supervision.service"

interface UseMonthlySupervisionContextParams {
  /** Presente al editar: manda sobre el trío cliente/provider/mes */
  monthlySupervisionId?: string
  clientId?: string
  providerId?: string
  /** `yyyyMM` */
  reportMonth?: string
}

interface UseMonthlySupervisionContextReturn {
  context: MonthlySupervisionContext | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Carga el contexto del reporte por los dos caminos posibles:
 *
 * - **Con id** → `GET /{id}/appointments`, que lee el registro guardado.
 * - **Sin id** → `GET /appointments?clientId&providerId&monthYear`, que arma uno
 *   nuevo con los appointments elegibles del mes.
 *
 * Al crear, el trío se completa de a poco (primero el cliente, después el
 * provider, después el mes): mientras falte alguno no se pide nada, y así se
 * evita una ráfaga de requests incompletas mientras el usuario elige.
 */
export function useMonthlySupervisionContext(
  params: UseMonthlySupervisionContextParams,
): UseMonthlySupervisionContextReturn {
  const { monthlySupervisionId, clientId, providerId, reportMonth } = params

  const [context, setContext] = useState<MonthlySupervisionContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Cambiar de mes rápido dispara varias cargas: sin esto, la respuesta lenta
  // de la anterior pisa a la nueva y la pantalla queda con datos de otro mes.
  const requestIdRef = useRef(0)

  // Con un reporte existente manda el id y nada más: el formulario vuelca en su
  // estado el cliente/provider/mes que vinieron en la respuesta, y sin esto ese
  // volcado dispararía una segunda carga idéntica.
  const isExisting = !!monthlySupervisionId
  const effectiveClientId = isExisting ? "" : clientId ?? ""
  const effectiveProviderId = isExisting ? "" : providerId ?? ""
  const effectiveReportMonth = isExisting ? "" : reportMonth ?? ""

  const load = useCallback(async () => {
    const canLoadExisting = !!monthlySupervisionId
    const canLoadNew = !!effectiveClientId && !!effectiveProviderId && !!effectiveReportMonth

    if (!canLoadExisting && !canLoadNew) {
      setContext(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const data = canLoadExisting
        ? await getMonthlySupervisionById(monthlySupervisionId!)
        : await getSupervisionAppointments({
            clientId: effectiveClientId,
            providerId: effectiveProviderId,
            reportMonth: effectiveReportMonth,
          })

      if (requestId !== requestIdRef.current) return
      setContext(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err : new Error("Failed to load monthly supervision"))
      setContext(null)
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [monthlySupervisionId, effectiveClientId, effectiveProviderId, effectiveReportMonth])

  useEffect(() => {
    void load()
  }, [load])

  return { context, isLoading, error, refetch: load }
}
