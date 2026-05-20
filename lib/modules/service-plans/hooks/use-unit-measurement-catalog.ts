"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getUnitMeasurementCatalog,
  type UnitMeasurementCatalogItem,
} from "../services/unit-measurement-catalog.service"

interface GroupedOption {
  group: string
  options: { value: string; label: string }[]
}

interface UseUnitMeasurementCatalogReturn {
  groups: GroupedOption[]
  items: UnitMeasurementCatalogItem[]
  itemsMap: Map<string, UnitMeasurementCatalogItem>
  isLoading: boolean
  error: Error | null
}

export function useUnitMeasurementCatalog(enabled = true): UseUnitMeasurementCatalogReturn {
  const [items, setItems] = useState<UnitMeasurementCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const fetchCatalog = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)
      const data = await getUnitMeasurementCatalog()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch unit measurement catalog"))
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void fetchCatalog()
  }, [fetchCatalog])

  const groups = useMemo<GroupedOption[]>(() => {
    const groupMap = new Map<string, { value: string; label: string }[]>()
    for (const item of items) {
      if (!groupMap.has(item.group)) {
        groupMap.set(item.group, [])
      }
      groupMap.get(item.group)!.push({ value: item.id, label: item.name })
    }
    return Array.from(groupMap.entries()).map(([group, options]) => ({ group, options }))
  }, [items])

  const itemsMap = useMemo(() => {
    const map = new Map<string, UnitMeasurementCatalogItem>()
    for (const item of items) {
      map.set(item.id, item)
    }
    return map
  }, [items])

  return { groups, items, itemsMap, isLoading, error }
}
