"use client"

import type { ClientListItem } from "@/lib/types/client.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getClients } from "../services/clients.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

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
  const initialParamsKey = JSON.stringify({
    page: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? 10,
    filters: initialParams?.filters ?? [],
  })

  const resource = usePaginatedResource<ClientListItem, UseClientsParams>({
    params: initialParams,
    paramsKey: initialParamsKey,
    fetcher: async (params) => {
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getClients(query)
      return { items: data.clients, totalCount: data.totalCount }
    },
  })

  return {
    clients: resource.items,
    isLoading: resource.isLoading,
    error: resource.error,
    totalCount: resource.totalCount,
    refetch: resource.refetch,
  }
}
