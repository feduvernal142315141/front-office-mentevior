"use client"

import { useEffect, useState } from "react"
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

export function useAddressesTable() {
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [inputValue, setInputValue] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filters = buildFilters([
    searchQuery && { field: "city", operator: FilterOperator.Contains, value: searchQuery },
  ])

  const queryModel = {
    pageNumber: page,
    pageSize,
    filters,
  }

  const { addresses, totalCount, isLoading, error, refetch } = useAddresses(queryModel)

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const handleSearchQueryChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setPage(1)
  }

  const columns: CustomTableColumn<AddressListItem>[] = [
    {
      key: "address",
      header: "Address",
      render: (address: AddressListItem) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="font-medium text-gray-900">{address.address}</span>
        </div>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (address: AddressListItem) => (
        <span className="text-gray-600">{address.city}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (address: AddressListItem) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{address.state}</div>
          <div className="text-gray-500">{address.country}</div>
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
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    pageSizeOptions: [10, 20, 50],
  }

  return {
    data: addresses,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      inputValue,
      setSearchQuery: handleSearchQueryChange,
      setInputValue,
    },
    pagination,
    totalCount,
    filteredCount: totalCount,
    clearFilters,
    refetch,
  }
}
