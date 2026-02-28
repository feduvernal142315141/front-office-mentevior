"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Sliders } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { ClientListItem } from "@/lib/types/client.types"
import { useClients } from "@/lib/modules/clients/hooks/use-clients"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { formatDate } from "@/lib/utils/date"

type StatusFilter = "all" | "active" | "inactive"

interface UseClientsTableReturn {
  data: ClientListItem[]
  columns: CustomTableColumn<ClientListItem>[]
  isLoading: boolean
  error: Error | null
  filters: {
    inputValue: string
    searchQuery: string
    setSearchQuery: (value: string) => void
    statusFilter: StatusFilter
    setStatusFilter: (value: StatusFilter) => void
  }
  pagination: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  totalCount: number
  filteredCount: number
  clearFilters: () => void
  refetch: () => void
}

export function useClientsTable(): UseClientsTableReturn {
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtersArray = useMemo(() => {
    const filters: FilterRule[] = []
    
    if (statusFilter === "active") {
      filters.push({
        field: "active",
        value: true,
        operator: FilterOperator.eq,
        type: "boolean" as const,
      })
    } else if (statusFilter === "inactive") {
      filters.push({
        field: "active",
        value: false,
        operator: FilterOperator.eq,
        type: "boolean" as const,
      })
    }

    
    return buildFilters(
      filters,
      {
        fields: ["firstName", "lastName"],
        search: searchQuery,
      }
    )
  }, [searchQuery, statusFilter])

  const { clients, isLoading, error, totalCount, refetch } = useClients({
    page: page - 1,
    pageSize,
    filters: filtersArray,
  })

  useEffect(() => {
    refetch({ page: page - 1, pageSize, filters: filtersArray })
  }, [searchQuery, statusFilter, page, pageSize, filtersArray])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setStatusFilter("active") // Reset to default "active"
    setPage(1)
  }
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const columns: CustomTableColumn<ClientListItem>[] = useMemo(() => [
    {
      key: "fullName",
      header: "Client Name",
      render: (client) => (
        <span className="text-sm font-medium text-slate-900">
          {client.fullName}
        </span>
      ),
    },
    {
      key: "chartId",
      header: "Chart ID",
      render: (client) => (
        <span className="text-sm text-slate-700 font-mono">{client.chartId || "—"}</span>
      ),
    },
    {
      key: "diagnosis",
      header: "Diagnosis",
      render: (client) => (
        <span className="text-sm text-slate-700">{client.diagnosis || "—"}</span>
      ),
    },
    {
      key: "insurance",
      header: "Insurance",
      render: (client) => (
        <span className="text-sm text-slate-700">{client.insurance || "—"}</span>
      ),
    },
    {
      key: "rbt",
      header: "RBT",
      render: (client) => (
        <span className="text-sm text-slate-700">{client.rbt || "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      align: "center",
      render: (client) => (
        <span className="text-sm text-slate-600">
          {client.createdAt ? formatDate(client.createdAt, "MMM dd, yyyy") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (client) => (
        <Badge
          variant="outline"
          className={cn(
            client.status
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200"
          )}
        >
          {client.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (client) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/clients/${client.id}/profile`)}
            className={cn(
              "group/profile relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-slate-50 to-slate-100/80",
              "border border-slate-200/70 shadow-sm shadow-slate-900/5",
              "hover:from-slate-100 hover:to-slate-200/90",
              "hover:border-slate-300/80 hover:shadow-md hover:shadow-slate-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:ring-offset-2"
            )}
            title="View profile"
            aria-label="View profile"
          >
            <Sliders className="w-4 h-4 text-slate-600 group-hover/profile:text-[#037ECC] transition-colors duration-200" />
          </button>
          <button
            onClick={() => router.push(`/clients/${client.id}/edit`)}
            className={cn(
              "group/edit relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-blue-50 to-blue-100/80",
              "border border-blue-200/60 shadow-sm shadow-blue-900/5",
              "hover:from-blue-100 hover:to-blue-200/90",
              "hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
            )}
            title="Edit client"
            aria-label="Edit client"
          >
            <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ], [router])

  return {
    data: clients,
    columns,
    isLoading,
    error,
    filters: {
      inputValue,
      searchQuery,
      setSearchQuery: handleSearchChange,
      statusFilter,
      setStatusFilter,
    },
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    },
    totalCount,
    filteredCount: clients.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
  }
}
