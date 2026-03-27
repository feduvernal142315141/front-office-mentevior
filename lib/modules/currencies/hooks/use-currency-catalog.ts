"use client"

import { useEffect, useState } from "react"
import type { CurrencyCatalogItem } from "@/lib/types/currency.types"
import { getCurrencyCatalog } from "../services/currency-catalog.service"

interface UseCurrencyCatalogReturn {
  currencies: CurrencyCatalogItem[]
  isLoading: boolean
  error: Error | null
}

export function useCurrencyCatalog(): UseCurrencyCatalogReturn {
  const [currencies, setCurrencies] = useState<CurrencyCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getCurrencyCatalog()
        if (active) setCurrencies(data)
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e : new Error("Failed to load currencies"))
          setCurrencies([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return { currencies, isLoading, error }
}
