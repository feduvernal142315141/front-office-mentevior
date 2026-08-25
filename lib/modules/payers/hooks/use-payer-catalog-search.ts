"use client"

import { useEffect, useRef, useState } from "react"
import type { PayerCatalogSearchItem } from "@/lib/types/payer.types"
import { getPayersService } from "../services/payers.service"

const DEBOUNCE_MS = 400

interface UsePayerCatalogSearchArgs {
  clearingHouseId: string
  searchText: string
  payerState?: string
  enabled: boolean
}

export function usePayerCatalogSearch({
  clearingHouseId,
  searchText,
  payerState,
  enabled,
}: UsePayerCatalogSearchArgs) {
  const [items, setItems] = useState<PayerCatalogSearchItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!enabled || !clearingHouseId || !searchText.trim()) {
      requestIdRef.current += 1
      setItems([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current
      setIsLoading(true)
      try {
        const result = await getPayersService().searchPayerCatalog(clearingHouseId, {
          searchText,
          payerState,
          page: 0,
          pageSize: 20,
        })
        if (requestIdRef.current !== requestId) return
        setItems(result.items)
        setTotalCount(result.totalCount)
      } catch {
        if (requestIdRef.current !== requestId) return
        setItems([])
        setTotalCount(0)
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [clearingHouseId, searchText, payerState, enabled])

  return { items, totalCount, isLoading }
}
