"use client"

import type { ClinicalDocumentListItem } from "@/lib/types/clinical-document.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getClinicalDocuments } from "../services/clinical-documents.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UseClinicalDocumentsParams {
  page?: number
  pageSize?: number
  filters?: string[]
}

interface UseClinicalDocumentsReturn {
  data: {
    clinicalDocuments: ClinicalDocumentListItem[]
    totalCount: number
  } | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useClinicalDocuments(initialParams?: UseClinicalDocumentsParams): UseClinicalDocumentsReturn {
  const initialParamsKey = JSON.stringify({
    page: initialParams?.page ?? 0,
    pageSize: initialParams?.pageSize ?? 10,
    filters: initialParams?.filters ?? [],
  })

  const resource = usePaginatedResource<ClinicalDocumentListItem, UseClinicalDocumentsParams>({
    params: initialParams,
    paramsKey: initialParamsKey,
    fetcher: async (params) => {
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: params?.filters && params.filters.length ? params.filters : undefined,
        orders: undefined,
      }
      const data = await getClinicalDocuments(query)
      return { items: data.clinicalDocuments, totalCount: data.totalCount }
    },
  })

  return {
    data: { clinicalDocuments: resource.items, totalCount: resource.totalCount },
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
