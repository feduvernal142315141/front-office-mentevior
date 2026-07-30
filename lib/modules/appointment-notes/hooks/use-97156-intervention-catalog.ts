"use client"

import { useState, useEffect } from "react"
import {
  get97156InterventionCatalog,
  type InterventionCatalog97156Item,
} from "../services/97156-intervention-catalog.service"

interface Use97156InterventionCatalogReturn {
  items: InterventionCatalog97156Item[]
  isLoading: boolean
  error: Error | null
}

export function use97156InterventionCatalog(): Use97156InterventionCatalogReturn {
  const [items, setItems] = useState<InterventionCatalog97156Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await get97156InterventionCatalog()
        if (!cancelled) setItems(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error("Failed to fetch intervention catalog"))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetch()
    return () => { cancelled = true }
  }, [])

  return { items, isLoading, error }
}
