"use client"

import { useState, useEffect, useCallback } from "react"
import type { AssessmentListItem } from "@/lib/types/assessment.types"
import type { QueryModel } from "@/lib/models/queryModel"
import { getAssessments } from "../services/assessments.service"

interface UseAssessmentsParams {
  page?: number
  pageSize?: number
  filters?: string[]
  orders?: string[]
}

interface UseAssessmentsReturn {
  assessments: AssessmentListItem[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAssessments(params?: UseAssessmentsParams): UseAssessmentsReturn {
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const filtersKey = params?.filters?.join("|") ?? ""
  const ordersKey = params?.orders?.join("|") ?? ""

  const fetchAssessments = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const query: QueryModel = {
        page: params?.page ?? 0,
        pageSize: params?.pageSize ?? 10,
        filters: filtersKey ? filtersKey.split("|") : undefined,
        orders: ordersKey ? ordersKey.split("|") : undefined,
      }
      const data = await getAssessments(query)
      setAssessments(data.assessments)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch assessments"))
      setAssessments([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.page, params?.pageSize, filtersKey, ordersKey])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  return { assessments, totalCount, isLoading, error, refetch: fetchAssessments }
}
