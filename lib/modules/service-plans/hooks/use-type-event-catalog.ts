"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getTypeEventCatalog,
  type TypeEventCatalogItem,
} from "../services/type-event-catalog.service"

interface GroupedOption {
  group: string
  options: { value: string; label: string }[]
}

interface UseTypeEventCatalogReturn {
  /** Grouped options ready for GroupedSelect */
  groups: GroupedOption[]
  /** Flat list of catalog items */
  items: TypeEventCatalogItem[]
  /** Lookup: UUID → catalog item (name, group) */
  itemsMap: Map<string, TypeEventCatalogItem>
  isLoading: boolean
  error: Error | null
}

export function useTypeEventCatalog(): UseTypeEventCatalogReturn {
  const [items, setItems] = useState<TypeEventCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getTypeEventCatalog()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch type event catalog"))
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    const map = new Map<string, TypeEventCatalogItem>()
    for (const item of items) {
      map.set(item.id, item)
    }
    return map
  }, [items])

  return { groups, items, itemsMap, isLoading, error }
}
