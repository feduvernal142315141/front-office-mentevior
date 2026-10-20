/**
 * USE ADDRESSES
 * 
 * Hook to fetch paginated addresses list.
 */

"use client"

import type { AddressListItem } from "@/lib/types/address.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getAddresses } from "../services/addresses.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UseAddressesParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseAddressesReturn {
  addresses: AddressListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (params?: UseAddressesParams) => Promise<void>
}

export function useAddresses(initialParams?: UseAddressesParams): UseAddressesReturn {
  const initialParamsKey = JSON.stringify({
    page: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? 10,
    filters: initialParams?.filters ?? [],
  })

  const resource = usePaginatedResource<AddressListItem, UseAddressesParams>({
    params: initialParams,
    paramsKey: initialParamsKey,
    fetcher: async (params) => {
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getAddresses(query)
      return { items: data.addresses, totalCount: data.totalCount }
    },
  })

  return {
    addresses: resource.items,
    totalCount: resource.totalCount,
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
