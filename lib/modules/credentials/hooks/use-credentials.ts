"use client"

import type { CredentialListItem } from "@/lib/types/credential.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getCredentials } from "../services/credentials.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UseCredentialsParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseCredentialsReturn {
  credentials: CredentialListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (params?: UseCredentialsParams) => Promise<void>
}

export function useCredentials(initialParams?: UseCredentialsParams): UseCredentialsReturn {
  const initialParamsKey = JSON.stringify({
    page: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? 10,
    filters: initialParams?.filters ?? [],
  })

  const resource = usePaginatedResource<CredentialListItem, UseCredentialsParams>({
    params: initialParams,
    paramsKey: initialParamsKey,
    fetcher: async (params) => {
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getCredentials(query)
      return { items: data.credentials, totalCount: data.totalCount }
    },
  })

  return {
    credentials: resource.items,
    totalCount: resource.totalCount,
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
