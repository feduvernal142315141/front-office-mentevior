"use client"

import { useEffect, useState } from "react"
import {
  getPeriodCatalog,
  type PeriodCatalogItem,
} from "../services/period-catalog.service"

export function usePeriodCatalog() {
  const [items, setItems] = useState<PeriodCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const data = await getPeriodCatalog()
        if (active) setItems(data)
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return { items, isLoading }
}
