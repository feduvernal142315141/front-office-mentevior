"use client"

import { useEffect, useMemo, useState } from "react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { useCompanyServices } from "@/lib/modules/services/hooks/use-company-services"
import { useToggleCompanyServiceStatus } from "@/lib/modules/services/hooks/use-toggle-company-service-status"
import type { CompanyServiceListItem } from "@/lib/types/company-service.types"

type StatusFilter = "all" | "active" | "inactive"

function credentialCount(item: CompanyServiceListItem): number {
  return item.totalCredential ?? item.allowedCredentials.length
}

function billingCodeCount(item: CompanyServiceListItem): number {
  return item.totalBillingCode ?? item.allowedBillingCodes.length
}

export function useServicesTable() {
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { services, isLoading, error, refetch } = useCompanyServices()
  const { toggleStatus, isLoading: isToggling } = useToggleCompanyServiceStatus()

  useEffect(() => {
    void refetch()
  }, [refetch])

  const filteredData = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchQuery ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.active) ||
        (statusFilter === "inactive" && !service.active)

      return matchesSearch && matchesStatus
    })
  }, [services, searchQuery, statusFilter])

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setStatusFilter("all")
    setPage(1)
  }

  const handleToggleService = async (service: CompanyServiceListItem, active: boolean) => {
    await toggleStatus({ id: service.id, active })
    await refetch()
  }

  const pagination = {
    page,
    pageSize,
    total: filteredData.length,
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
    isToggling,
    error,
    counts: {
      credentialCount,
      billingCodeCount,
    },
    actions: {
      toggleService: handleToggleService,
    },
    filters: {
      searchQuery,
      inputValue,
      statusFilter,
      setSearchQuery: handleSearchChange,
      setStatusFilter,
    },
    pagination,
    clearFilters,
    refetch,
  }
}
