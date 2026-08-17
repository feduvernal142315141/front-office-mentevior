"use client"

import { useCallback, useEffect, useState } from "react"
import type { ClientCategoryWithItems } from "@/lib/types/assessment.types"
import { getClientCategoryItems } from "../services/client-category-items.service"

interface UseClientCategoryItemsReturn {
  categories: ClientCategoryWithItems[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Categorías + items del SP activo del cliente elegido en el formulario.
 * Sin cliente no pide nada; lista vacía = cliente sin Service Plan activo.
 */
export function useClientCategoryItems(clientId?: string | null): UseClientCategoryItemsReturn {
  const [categories, setCategories] = useState<ClientCategoryWithItems[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!clientId) {
      setCategories([])
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setCategories(await getClientCategoryItems(clientId))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch client category items"))
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, isLoading, error, refetch: fetchCategories }
}
