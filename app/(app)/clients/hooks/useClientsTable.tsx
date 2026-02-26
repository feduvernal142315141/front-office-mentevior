"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Edit2, UserSquare2 } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { ClientListItem } from "@/lib/types/client.types"
import { useClients } from "@/lib/modules/clients/hooks/use-clients"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
    insuranceFilter: string
    setInsuranceFilter: (value: string) => void
    rbtFilter: string
    setRbtFilter: (value: string) => void
  }
  pagination: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  uniqueInsurances: string[]
  uniqueRBTs: string[]
  totalCount: number
  filteredCount: number
  clearFilters: () => void
  refetch: () => void
}

export function useClientsTable(): UseClientsTableReturn {
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [insuranceFilter, setInsuranceFilter] = useState<string>("all")
  const [rbtFilter, setRbtFilter] = useState<string>("all")

  const filtersArray = useMemo(() => {
    const filters: string[] = []
    
    if (statusFilter === "active") {
      filters.push("status__EQ__true")
    } else if (statusFilter === "inactive") {
      filters.push("status__EQ__false")
    }
    
    if (searchQuery) {
      filters.push(`fullName__CONTAINS__${searchQuery}`)
    }
    
    return filters
  }, [searchQuery, statusFilter])

  const { clients, isLoading, error, totalCount, refetch } = useClients({
    page: page - 1,
    pageSize,
    filters: filtersArray,
  })

  useEffect(() => {
    refetch({ page: page - 1, pageSize, filters: filtersArray })
  }, [searchQuery, page, pageSize, statusFilter, insuranceFilter, rbtFilter])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setStatusFilter("all")
    setInsuranceFilter("all")
    setRbtFilter("all")
    setPage(1)
  }
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const uniqueInsurances: string[] = []
  const uniqueRBTs: string[] = []

  const columns: CustomTableColumn<ClientListItem>[] = useMemo(() => [
    {
      key: "fullName",
      header: "Client Name",
      render: (client) => (
        <Link
          href={`/clients/${client.id}/edit`}
          className="text-sm font-medium text-[#037ECC] hover:underline hover:text-[#079CFB] transition-colors"
        >
          {client.fullName}
        </Link>
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
      key: "chartId",
      header: "Chart ID",
      render: (client) => (
        <span className="text-sm text-slate-700 font-mono">{client.chartId || "—"}</span>
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
              "bg-gradient-to-b from-purple-50 to-purple-100/80",
              "border border-purple-200/60 shadow-sm shadow-purple-900/5",
              "hover:from-purple-100 hover:to-purple-200/90",
              "hover:border-purple-300/80 hover:shadow-md hover:shadow-purple-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:ring-offset-2"
            )}
            title="View profile"
            aria-label="View profile"
          >
            <UserSquare2 className="w-4 h-4 text-purple-600 group-hover/profile:text-purple-700 transition-colors duration-200" />
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
      insuranceFilter,
      setInsuranceFilter,
      rbtFilter,
      setRbtFilter,
    },
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    },
    uniqueInsurances,
    uniqueRBTs,
    totalCount,
    filteredCount: clients.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
  }
}
