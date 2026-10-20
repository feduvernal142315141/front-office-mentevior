"use client"

import type { HRDocumentListItem } from "@/lib/types/hr-document.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getHRDocuments } from "../services/hr-documents.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UseHRDocumentsParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseHRDocumentsReturn {
  data: {
    hrDocuments: HRDocumentListItem[]
    totalCount: number
  } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useHRDocuments(initialParams?: UseHRDocumentsParams): UseHRDocumentsReturn {
  const initialParamsKey = JSON.stringify({
    page: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? 10,
    filters: initialParams?.filters ?? [],
  })

  const resource = usePaginatedResource<HRDocumentListItem, UseHRDocumentsParams>({
    params: initialParams,
    paramsKey: initialParamsKey,
    fetcher: async (params) => {
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getHRDocuments(query)
      return { items: data.hrDocuments, totalCount: data.totalCount }
    },
  })

  return {
    data: { hrDocuments: resource.items, totalCount: resource.totalCount },
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
