"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { getClientDataCollectionValuesByCategory } from "@/lib/modules/client-service-plan/services/client-data-collection-values.service"
import type { ClientDataCollectionRecord } from "@/lib/types/client-data-collection.types"

interface UseClientDataCollectionValuesByCategoryResult {
  /** Registros por `clientServicePlanCategoryItemId` */
  recordsByItemId: Map<string, ClientDataCollectionRecord[]>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Data collections de todos los items de una categoría en un rango de fechas
 * (`GET …/by-category-id/{categoryId}`). Una sola llamada reemplaza el N×GET
 * por item que usaban las gráficas agregadas.
 */
export function useClientDataCollectionValuesByCategory(
  categoryId: string | null | undefined,
  startDate: string,
  endDate: string,
): UseClientDataCollectionValuesByCategoryResult {
  const [recordsByItemId, setRecordsByItemId] = useState<Map<string, ClientDataCollectionRecord[]>>(
    () => new Map(),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!categoryId || !startDate || !endDate) {
      setRecordsByItemId(new Map())
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const groups = await getClientDataCollectionValuesByCategory(categoryId, startDate, endDate)
      const next = new Map<string, ClientDataCollectionRecord[]>()
      for (const group of groups) {
        next.set(group.clientServicePlanCategoryItemId, group.dataCollection)
      }
      setRecordsByItemId(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data collection values")
      setRecordsByItemId(new Map())
    } finally {
      setIsLoading(false)
    }
  }, [categoryId, startDate, endDate])

  useEffect(() => {
    let active = true

    void (async () => {
      if (!categoryId || !startDate || !endDate) {
        if (active) {
          setRecordsByItemId(new Map())
          setIsLoading(false)
          setError(null)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const groups = await getClientDataCollectionValuesByCategory(categoryId, startDate, endDate)
        if (!active) return
        const next = new Map<string, ClientDataCollectionRecord[]>()
        for (const group of groups) {
          next.set(group.clientServicePlanCategoryItemId, group.dataCollection)
        }
        setRecordsByItemId(next)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load data collection values")
        setRecordsByItemId(new Map())
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [categoryId, startDate, endDate])

  return useMemo(
    () => ({
      recordsByItemId,
      isLoading,
      error,
      refetch: fetch,
    }),
    [recordsByItemId, isLoading, error, fetch],
  )
}
