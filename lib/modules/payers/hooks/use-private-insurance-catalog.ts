"use client"

import { useEffect, useMemo, useState } from "react"
import type { PayerCatalogItem } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

interface UsePrivateInsuranceCatalogReturn {
  items: PayerCatalogItem[]
  filteredItems: PayerCatalogItem[]
  isLoading: boolean
  error: string | null
  search: string
  setSearch: (value: string) => void
}

export function usePrivateInsuranceCatalog(): UsePrivateInsuranceCatalogReturn {
  const [items, setItems] = useState<PayerCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getPayersService().getPrivateInsurancesCatalog()
        if (isActive) setItems(result)
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load catalog")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()
    return () => { isActive = false }
  }, [])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? items.filter((item) => item.name.toLowerCase().includes(term)) : items
  }, [items, search])

  return { items, filteredItems, isLoading, error, search, setSearch }
}
