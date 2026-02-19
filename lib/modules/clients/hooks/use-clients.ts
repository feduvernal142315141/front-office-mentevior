"use client"

import { useState, useEffect, useCallback } from "react"
import type { ClientListItem } from "@/lib/types/client.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getClients } from "../services/clients.service"

interface UseClientsParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseClientsReturn {
  clients: ClientListItem[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  refetch: (params?: UseClientsParams) => Promise<void>
}

export function useClients(initialParams?: UseClientsParams): UseClientsReturn {
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchClients = useCallback(async (params?: UseClientsParams) => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getClients(query)
      setClients(data.clients)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch clients"))
      setClients([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients(initialParams)
  }, [])

  return { clients, isLoading, error, totalCount, refetch: fetchClients }
}
