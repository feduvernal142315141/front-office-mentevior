"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { CredentialListItem } from "@/lib/types/credential.types"
import { useCredentials } from "@/lib/modules/credentials/hooks/use-credentials"
import { Edit2 } from "lucide-react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"

export function useCredentialsTable() {
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtersArray = useMemo(() => {
    return buildFilters(
      [],
      {
        fields: ["name"],
        search: searchQuery,
      }
    )
  }, [searchQuery])

  const { credentials, totalCount, isLoading, error, refetch } = useCredentials({
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
  }, [searchQuery, page, pageSize, filtersArray, refetch])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setPage(1)
  }
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const columns: CustomTableColumn<CredentialListItem>[] = useMemo(() => [
    {
      key: "name",
      header: "Name",
      render: (item: CredentialListItem) => (
        <span className="text-lg font-bold text-gray-900">{item.name}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (item: CredentialListItem) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/credentials/${item.id}/edit`)}
            className="
              group/edit
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
            title="Edit credential"
            aria-label="Edit credential"
          >
            <Edit2 className="
              w-4 h-4
              text-blue-600
              group-hover/edit:text-blue-700
              transition-colors duration-200
            " />
          </button>
        </div>
      ),
    },
  ], [router])

  const pagination = {
    page,
    pageSize,
    total: totalCount,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    pageSizeOptions: [10, 25, 50, 100],
  }

  return {
    data: credentials,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      inputValue,
      setSearchQuery: handleSearchChange,
      setInputValue,
    },
    pagination,
    totalCount,
    filteredCount: credentials.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
  }
}
