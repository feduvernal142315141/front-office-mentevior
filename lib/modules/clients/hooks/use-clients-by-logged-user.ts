"use client"

import { useState, useEffect, useCallback } from "react"
import type { ClientByLoggedUser } from "@/lib/types/client.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getClientsByLoggedUser } from "../services/clients.service"

interface UseClientsByLoggedUserParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseClientsByLoggedUserReturn {
  clients: ClientByLoggedUser[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  refetch: (params?: UseClientsByLoggedUserParams) => Promise<void>
}

export function useClientsByLoggedUser(initialParams?: UseClientsByLoggedUserParams): UseClientsByLoggedUserReturn {
  const [clients, setClients] = useState<ClientByLoggedUser[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchClients = useCallback(async (params?: UseClientsByLoggedUserParams) => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 20,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getClientsByLoggedUser(query)
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
