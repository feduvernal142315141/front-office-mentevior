"use client"

import { useEffect, useMemo, useState } from "react"
import type { ActivityCategoryCatalogItem } from "@/lib/types/case-supervision-log.types"
import { getActivityCategoryCatalog } from "../services/case-supervision-log.service"

export function useActivityCategoryCatalog() {
  const [items, setItems] = useState<ActivityCategoryCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    getActivityCategoryCatalog()
      .then((data) => { if (active) setItems(data) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  const selectOptions = useMemo(
    () => items.map((item) => ({ value: item.id, label: item.name })),
    [items],
  )

  return { items, selectOptions, isLoading }
}
