"use client"

import { useCallback, useEffect, useState } from "react"

import {
  getClientDataCollectionValues,
  upsertClientDataCollectionValue,
} from "@/lib/modules/client-service-plan/services/client-data-collection-values.service"
import type {
  ClientDataCollectionRecord,
  UpsertClientDataCollectionDto,
} from "@/lib/types/client-data-collection.types"

interface UseClientDataCollectionValuesParams {
  clientServicePlanCategoryItemId: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
}

interface UseClientDataCollectionValuesResult {
  records: ClientDataCollectionRecord[]
  /** Map of date (YYYY-MM-DD) → record for quick lookup */
  recordsByDate: Map<string, ClientDataCollectionRecord>
  isLoading: boolean
  error: string | null
  /** Save a single value (upsert). Refreshes records on success. */
  saveValue: (dto: UpsertClientDataCollectionDto) => Promise<void>
  isSaving: boolean
  refetch: () => Promise<void>
}

export function useClientDataCollectionValues(
  params: UseClientDataCollectionValuesParams,
): UseClientDataCollectionValuesResult {
  const { clientServicePlanCategoryItemId, startDate, endDate } = params
  const [records, setRecords] = useState<ClientDataCollectionRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!clientServicePlanCategoryItemId || !startDate || !endDate) {
      setRecords([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getClientDataCollectionValues({
        clientServicePlanCategoryItemId,
        startDate,
        endDate,
      })
      setRecords(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data collection values")
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [clientServicePlanCategoryItemId, startDate, endDate])

  useEffect(() => {
    let active = true

    void (async () => {
      if (!clientServicePlanCategoryItemId || !startDate || !endDate) {
        setRecords([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await getClientDataCollectionValues({
          clientServicePlanCategoryItemId,
          startDate,
          endDate,
        })
        if (!active) return
        setRecords(data)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load data collection values")
        setRecords([])
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [clientServicePlanCategoryItemId, startDate, endDate])

  const recordsByDate = useCallback(() => {
    const map = new Map<string, ClientDataCollectionRecord>()
    for (const rec of records) {
      // Normalize to YYYY-MM-DD (API returns date-only)
      const dateKey = rec.date.slice(0, 10)
      map.set(dateKey, rec)
    }
    return map
  }, [records])

  const saveValue = useCallback(
    async (dto: UpsertClientDataCollectionDto) => {
      setIsSaving(true)
      try {
        await upsertClientDataCollectionValue(dto)
        // Refetch to get updated records
        await fetch()
      } finally {
        setIsSaving(false)
      }
    },
    [fetch],
  )

  return {
    records,
    recordsByDate: recordsByDate(),
    isLoading,
    error,
    saveValue,
    isSaving,
    refetch: fetch,
  }
}
