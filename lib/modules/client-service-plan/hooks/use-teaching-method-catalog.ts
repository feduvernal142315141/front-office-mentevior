"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getTeachingMethodCatalog,
  type TeachingMethodCatalogItem,
} from "../services/teaching-method-catalog.service"

export function useTeachingMethodCatalog() {
  const [items, setItems] = useState<TeachingMethodCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const data = await getTeachingMethodCatalog()
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
