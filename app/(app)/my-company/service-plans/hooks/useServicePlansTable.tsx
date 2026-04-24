"use client"

import { useEffect, useMemo, useState } from "react"
import { useCompanyServicePlans } from "@/lib/modules/service-plans/hooks/use-company-service-plans"

export function useServicePlansTable() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { servicePlans, isLoading, error, refetch } = useCompanyServicePlans()

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return servicePlans.slice(start, start + pageSize)
  }, [servicePlans, page, pageSize])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(servicePlans.length / pageSize))
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [servicePlans.length, page, pageSize])

  const pagination = {
    page,
    pageSize,
    total: servicePlans.length,
    onPageChange: setPage,
    onPageSizeChange: (newSize: number) => {
      setPageSize(newSize)
      setPage(1)
    },
    pageSizeOptions: [10, 25, 50, 100],
  }

  return {
    data: pagedData,
    isLoading,
    error,
    pagination,
    refetch,
  }
}
