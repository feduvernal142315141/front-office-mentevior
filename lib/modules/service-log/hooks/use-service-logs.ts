"use client"

import { useCallback, useEffect, useState } from "react"
import type { QueryModel } from "@/lib/models/queryModel"
import type { ServiceLogListItem } from "@/lib/types/service-log.types"
import { getServiceLogs } from "../services/service-log.service"

interface UseServiceLogsParams {
  page?: number
  pageSize?: number
  filters?: string[]
  orders?: string[]
  /**
   * Cambiarlo fuerza un refetch con los mismos parámetros. La generación es
   * asíncrona: tras encolar un POST, la página lo incrementa (con reintentos
   * diferidos) para capturar lo que el backend persiste en segundo plano.
   */
  reloadKey?: number
}

interface UseServiceLogsReturn {
  items: ServiceLogListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useServiceLogs(params?: UseServiceLogsParams): UseServiceLogsReturn {
  const [items, setItems] = useState<ServiceLogListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Los arrays cambian de identidad en cada render: se comparan por contenido
  const filtersKey = params?.filters?.join("|") ?? ""
  const ordersKey = params?.orders?.join("|") ?? ""
  const page = params?.page ?? 0
  const pageSize = params?.pageSize ?? 10
  const reloadKey = params?.reloadKey ?? 0

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const query: QueryModel = {
        page,
        pageSize,
        filters: filtersKey ? filtersKey.split("|") : undefined,
        orders: ordersKey ? ordersKey.split("|") : undefined,
      }

      const data = await getServiceLogs(query)
      setItems(data.items)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch service logs"))
      setItems([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
    // `reloadKey` no participa de la query: solo fuerza re-ejecutar el fetch
  }, [page, pageSize, filtersKey, ordersKey, reloadKey])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  return { items, totalCount, isLoading, error, refetch: fetchItems }
}
