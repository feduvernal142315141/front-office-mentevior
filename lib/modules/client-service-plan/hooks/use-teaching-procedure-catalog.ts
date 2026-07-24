"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getTeachingProcedureCatalog,
  type TeachingProcedureCatalogItem,
} from "../services/teaching-procedure-catalog.service"

export function useTeachingProcedureCatalog() {
  const [items, setItems] = useState<TeachingProcedureCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const data = await getTeachingProcedureCatalog()
        if (active) setItems(data)
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const selectOptions = useMemo(
    () => items.map((item) => ({ value: item.id, label: item.name })),
    [items]
  )

  return { items, selectOptions, isLoading }
}
