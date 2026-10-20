/**
 * USE APPLICANTS
 * 
 * Hook to fetch paginated applicants list.
 */

"use client"

import type { Applicant } from "@/lib/types/applicant.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getApplicants } from "../services/applicants.service"
import { usePaginatedResource } from "@/lib/hooks/use-paginated-resource"

interface UseApplicantsReturn {
  applicants: Applicant[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: (query?: QueryModel) => Promise<void>
}

export function useApplicants(initialQuery?: QueryModel): UseApplicantsReturn {
  const initialQueryKey = JSON.stringify(initialQuery ?? {})

  const resource = usePaginatedResource<Applicant, QueryModel>({
    params: initialQuery,
    paramsKey: initialQueryKey,
    fetcher: async (query) => {
      const data = await getApplicants(query || {})
      return { items: data.applicants, totalCount: data.totalCount }
    },
  })

  return {
    applicants: resource.items,
    totalCount: resource.totalCount,
    isLoading: resource.isLoading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
