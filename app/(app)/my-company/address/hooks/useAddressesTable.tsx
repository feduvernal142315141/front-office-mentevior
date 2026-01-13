"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { AddressListItem } from "@/lib/types/address.types"
import { useAddresses } from "@/lib/modules/addresses/hooks/use-addresses"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/custom/Button"
import { Edit2, MapPin } from "lucide-react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"

type StatusFilter = "all" | "active" | "inactive"

export function useAddressesTable() {
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtersArray = useMemo(() => {
    const filters = []
    
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
        fields: ["nickName"],
        search: searchQuery,
      }
    )
  }, [searchQuery, statusFilter])

  const { addresses, totalCount, isLoading, error, refetch } = useAddresses({
    page: page - 1, 
    pageSize,
    filters: filtersArray,
  })

  useEffect(() => {
    refetch({
      page: page - 1,
      pageSize,
      filters: filtersArray,
    })
  }, [searchQuery, statusFilter, page, pageSize, filtersArray, refetch])

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
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const columns: CustomTableColumn<AddressListItem>[] = [
    {
      key: "nickName",
      header: "Nickname",
      render: (address: AddressListItem) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-medium text-gray-900">{address.nickName}</span>
        </div>
      ),
    },    
    {
      key: "location",
      header: "Location",
      render: (address: AddressListItem) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{address.address}</div>
          <div className="text-gray-500">{address.city}, {address.state}, {address.country}</div>
        </div>
      ),
    },
    {
      key: "zipCode",
      header: "Zip Code",
      render: (address: AddressListItem) => (
        <span className="text-gray-600">{address.zipCode}</span>
      ),
    },   
    {
      key: "active",
      header: "Status",
      render: (address: AddressListItem) => (
        <Badge
          variant={address.active ? "default" : "secondary"}
          className={
            address.active
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : ""
          }
        >
          {address.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (address: AddressListItem) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/my-company/address/${address.id}/edit`)}
            className="
              group/edit
              relative
              h-9 w-9
              flex items-center justify-center
              rounded-xl
              
              /* Background gradient */
              bg-gradient-to-b from-blue-50 to-blue-100/80
              
              /* Border */
              border border-blue-200/60
              
              /* Shadow */
              shadow-sm
              shadow-blue-900/5
              
              /* Hover */
              hover:from-blue-100
              hover:to-blue-200/90
              hover:border-blue-300/80
              hover:shadow-md
              hover:shadow-blue-900/10
              hover:-translate-y-0.5
              
              /* Active */
              active:translate-y-0
              active:shadow-sm
              
              /* Transitions */
              transition-all
              duration-200
              ease-out
              
              /* Focus */
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500/30
              focus:ring-offset-2
            "
            title="Edit address"
            aria-label="Edit address"
          >
            <Edit2 className="
              w-4 h-4
              text-blue-600
              group-hover/edit:text-blue-700
              transition-colors
              duration-200
            " />
          </button>
        </div>
      ),
    },
  ]

  const pagination = {
    page,
    pageSize,
    total: totalCount,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    pageSizeOptions: [10, 25, 50, 100],
  }

  return {
    data: addresses,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      inputValue,
      statusFilter,
      setSearchQuery: handleSearchChange,
      setInputValue,
      setStatusFilter,
    },
    pagination,
    totalCount,
    filteredCount: addresses.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
  }
}
