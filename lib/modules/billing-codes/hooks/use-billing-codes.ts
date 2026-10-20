"use client"

import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getBillingCodes } from "../services/billing-codes.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UseBillingCodesParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseBillingCodesReturn {
  billingCodes: BillingCodeListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (params?: UseBillingCodesParams) => Promise<void>
}

export function useBillingCodes(initialParams?: UseBillingCodesParams): UseBillingCodesReturn {
  const initialParamsKey = JSON.stringify({
    page: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? 10,
    filters: initialParams?.filters ?? [],
  })

  const resource = usePaginatedResource<BillingCodeListItem, UseBillingCodesParams>({
    params: initialParams,
    paramsKey: initialParamsKey,
    fetcher: async (params) => {
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getBillingCodes(query)
      return { items: data.billingCodes, totalCount: data.totalCount }
    },
  })

  return {
    billingCodes: resource.items,
    totalCount: resource.totalCount,
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
