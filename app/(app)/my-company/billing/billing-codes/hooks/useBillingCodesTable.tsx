
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { BillingCodeListItem } from "@/lib/types/billing-code.types"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2 } from "lucide-react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { deleteBillingCode } from "@/lib/modules/billing-codes/services/billing-codes.service"
import { toast } from "sonner"
import { FilterOperator } from "@/lib/models/filterOperator"

type StatusFilter = "all" | "active" | "inactive"
type TypeFilter = "all" | "CPT" | "HCPCS"

export function useBillingCodesTable() {
  const router = useRouter()
  
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<BillingCodeListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

    if (typeFilter !== "all") {
      filters.push({
        field: "typeCatalog.name",
        value: typeFilter,
        operator: FilterOperator.relatedContains,
        type: "string" as const,
      })
    }
    
    return buildFilters(
      filters,
      {
        fields: ["code"],
        search: searchQuery,
      }
    )
  }, [searchQuery, statusFilter, typeFilter])

  const { billingCodes, totalCount, isLoading, error, refetch } = useBillingCodes({
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
  }, [searchQuery, statusFilter, typeFilter, page, pageSize, filtersArray, refetch])

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setStatusFilter("all")
    setTypeFilter("all")
    setPage(1)
  }
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const handleDeleteClick = (code: BillingCodeListItem) => {
    setCodeToDelete(code)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!codeToDelete) return

    setIsDeleting(true)
    try {
      await deleteBillingCode(codeToDelete.id)
      toast.success("Billing code deleted successfully")
      setDeleteModalOpen(false)
      setCodeToDelete(null)
      refetch({ page: page - 1, pageSize, filters: filtersArray })
    } catch (error) {
      console.error("Error deleting billing code:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete billing code"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setCodeToDelete(null)
  }

  const columns: CustomTableColumn<BillingCodeListItem>[] = useMemo(() => [
    {
      key: "type",
      header: "Type",
      render: (item: BillingCodeListItem) => (
        <Badge 
          variant="outline"
          className={
            item.type === "CPT" 
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-purple-200 bg-purple-50 text-purple-700"
          }
        >
          {item.type}
        </Badge>
      ),
    },
    {
      key: "code",
      header: "Code",
      render: (item: BillingCodeListItem) => (
        <span className="text-sm text-gray-900">{item.modifier !=="" && item.modifier !==" " ? `${item.code}-${item.modifier}` : item.code}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (item: BillingCodeListItem) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-2">{item.description}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (item: BillingCodeListItem) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/my-company/billing/billing-codes/${item.id}/edit`)}
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
            title="Edit billing code"
            aria-label="Edit billing code"
          >
            <Edit2 className="
              w-4 h-4
              text-blue-600
              group-hover/edit:text-blue-700
              transition-colors duration-200
            " />
          </button>
          
          <button
            onClick={() => handleDeleteClick(item)}
            className="
              group/delete
              relative
              h-9 w-9
              flex items-center justify-center
              rounded-xl
              bg-gradient-to-b from-red-50 to-red-100/80
              border border-red-200/60
              shadow-sm shadow-red-900/5
              hover:from-red-100 hover:to-red-200/90
              hover:border-red-300/80
              hover:shadow-md hover:shadow-red-900/10
              hover:-translate-y-0.5
              active:translate-y-0 active:shadow-sm
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2
            "
            title="Delete billing code"
            aria-label="Delete billing code"
          >
            <Trash2 className="
              w-4 h-4
              text-red-600
              group-hover/delete:text-red-700
              transition-colors duration-200
            " />
          </button>
        </div>
      ),
    },
  ], [router, handleDeleteClick])

  const pagination = {
    page,
    pageSize,
    total: totalCount,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    pageSizeOptions: [10, 25, 50, 100],
  }

  return {
    data: billingCodes,
    columns,
    isLoading,
    error,
    filters: {
      searchQuery,
      inputValue,
      statusFilter,
      typeFilter,
      setSearchQuery: handleSearchChange,
      setInputValue,
      setStatusFilter,
      setTypeFilter,
    },
    pagination,
    totalCount,
    filteredCount: billingCodes.length,
    clearFilters,
    refetch: () => refetch({ page: page - 1, pageSize, filters: filtersArray }),
    deleteModal: (
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Billing Code"
        message="Are you sure you want to delete this billing code? This action cannot be undone."
        itemName={codeToDelete ? `${codeToDelete.code} - ${codeToDelete.type}` : undefined}
        isDeleting={isDeleting}
      />
    ),
  }
}
