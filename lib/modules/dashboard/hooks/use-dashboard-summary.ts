"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { DashboardScope, DashboardSummary } from "@/lib/types/dashboard.types"
import { fetchDashboardSummary } from "../services/dashboard.source"
import { type DashboardError, toDashboardError } from "../services/dashboard-error"

interface UseDashboardSummaryReturn {
  summary: DashboardSummary | null
  /** Primera carga: es la única que muestra esqueletos */
  isLoading: boolean
  /** Recarga con datos ya en pantalla: la vista se atenúa, no se vacía */
  isRefreshing: boolean
  error: DashboardError | null
  refetch: () => Promise<void>
}

/**
 * Firma idéntica con mock y con backend real: los widgets se escriben una vez.
 *
 * Dos decisiones que importan:
 *
 * 1. **Cargar ≠ refrescar.** Cambiar de alcance o pulsar Refresh conserva lo que
 *    ya está en pantalla; volver a esqueletos en cada recarga hace parpadear el
 *    dashboard entero y pierde el punto donde estaba el usuario.
 * 2. **Guarda de carrera.** Alternar el alcance rápido dispara dos requests; sin
 *    el contador, la respuesta lenta de la anterior pisa a la nueva y la vista
 *    termina mostrando un alcance distinto del que marca el selector.
 */
export function useDashboardSummary(
  /** `null` = todavía no se sabe el alcance; no se pide nada y se sigue cargando */
  scope: DashboardScope | null = "company",
): UseDashboardSummaryReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<DashboardError | null>(null)

  const requestIdRef = useRef(0)
  const hasDataRef = useRef(false)

  const load = useCallback(async () => {
    if (scope === null) return

    const requestId = ++requestIdRef.current

    if (hasDataRef.current) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const data = await fetchDashboardSummary(scope)
      if (requestId !== requestIdRef.current) return

      setSummary(data)
      hasDataRef.current = true
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      setError(toDashboardError(err))
      // Los datos viejos se descartan: con otro alcance ya no son de quien mira.
      setSummary(null)
      hasDataRef.current = false
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [scope])

  useEffect(() => {
    void load()
  }, [load])

  return { summary, isLoading, isRefreshing, error, refetch: load }
}
