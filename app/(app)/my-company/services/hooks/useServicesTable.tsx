"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { useCompanyServices } from "@/lib/modules/services/hooks/use-company-services"
import { useToggleCompanyServiceStatus } from "@/lib/modules/services/hooks/use-toggle-company-service-status"
import type { CompanyServiceListItem } from "@/lib/types/company-service.types"

type StatusFilter = "all" | "active" | "inactive"

export function useServicesTable(onViewDetails: (service: CompanyServiceListItem) => void) {
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

  const columns: CustomTableColumn<CompanyServiceListItem>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Service",
        className: "min-w-[320px]",
        render: (item) => (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
          </div>
        ),
      },
      {
        key: "allowedCredentials",
        header: "Credentials",
        className: "min-w-[170px] whitespace-nowrap",
        render: (item) => (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            {item.allowedCredentials.length} allowed
          </Badge>
        ),
      },
      {
        key: "allowedBillingCodes",
        header: "Billing Codes",
        className: "min-w-[170px] whitespace-nowrap",
        render: (item) => (
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
            {item.allowedBillingCodes.length} allowed
          </Badge>
        ),
      },
      {
        key: "active",
        header: "Active",
        className: "min-w-[130px] whitespace-nowrap",
        align: "right" as const,
        render: (item) => (
          <div className="flex justify-end" data-row-no-click="true">
            <Switch
              checked={item.active}
              disabled={isToggling}
              onCheckedChange={(checked) => {
                void handleToggleService(item, checked)
              }}
              aria-label={`Toggle ${item.name}`}
            />
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        className: "min-w-[120px] whitespace-nowrap",
        align: "right" as const,
        render: (item) => (
          <div className="flex justify-end" data-row-no-click="true">
            <button
              onClick={() => onViewDetails(item)}
              className="
                group/view
                relative
                h-9 w-9
                flex items-center justify-center
                rounded-xl
                bg-gradient-to-b from-blue-50 to-blue-100/80
                border border-blue-200/60
                shadow-sm shadow-blue-900/5
                hover:from-blue-100 hover:to-blue-200/90
                hover:border-blue-300/80
                hover:shadow-md hover:shadow-blue-900/10
                hover:-translate-y-0.5
                active:translate-y-0 active:shadow-sm
                transition-all duration-200 ease-out
                focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2
              "
              title="View details"
              aria-label="View details"
            >
              <Eye className="
                w-4 h-4
                text-blue-600
                group-hover/view:text-blue-700
                transition-colors duration-200
              " />
            </button>
          </div>
        ),
      },
    ],
    [isToggling, onViewDetails]
  )

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
    columns,
    isLoading,
    error,
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
