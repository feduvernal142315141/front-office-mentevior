/**
 * USE PHYSICIANS
 * 
 * Hook to fetch paginated physicians list.
 */

"use client"

import type { Physician } from "@/lib/types/physician.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getPhysicians } from "../services/physicians.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UsePhysiciansReturn {
  physicians: Physician[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (query?: QueryModel) => Promise<void>
}

interface UsePhysiciansOptions {
  enabled?: boolean
}

export function usePhysicians(
  initialQuery?: QueryModel,
  options?: UsePhysiciansOptions
): UsePhysiciansReturn {
  const enabled = options?.enabled ?? true
  const initialQueryKey = JSON.stringify(initialQuery ?? {})

  const resource = usePaginatedResource<Physician, QueryModel>({
    params: initialQuery,
    paramsKey: initialQueryKey,
    enabled,
    fetcher: async (query) => {
      const data = await getPhysicians(query || {})
      return { items: data.physicians, totalCount: data.totalCount }
    },
  })

  return {
    physicians: resource.items,
    totalCount: resource.totalCount,
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
