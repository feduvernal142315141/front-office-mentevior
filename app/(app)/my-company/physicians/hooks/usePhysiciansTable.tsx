"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { Physician } from "@/lib/types/physician.types"
import { usePhysicians } from "@/lib/modules/physicians/hooks/use-physicians"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/custom/Button"
import { Edit2, Stethoscope, Trash2 } from "lucide-react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { deletePhysician } from "@/lib/modules/physicians/services/physicians.service"
import { useToast } from "@/hooks/use-toast"

export function usePhysiciansTable() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [inputValue, setInputValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDeleting, setIsDeleting] = useState(false)

  const filters = buildFilters(
    [
      statusFilter === "active" ? { field: "active", operator: FilterOperator.Equals, value: true, type: "boolean" as const } : null,
      statusFilter === "inactive" ? { field: "active", operator: FilterOperator.Equals, value: false, type: "boolean" as const } : null,
    ].filter((f): f is NonNullable<typeof f> => f !== null),
    searchQuery ? { fields: ["firstName", "lastName"], search: searchQuery } : undefined
  )

  const queryModel = {
    pageNumber: page,
    pageSize,
    filters,
  }

  const { physicians, totalCount, isLoading, error, refetch } = usePhysicians(queryModel)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter])

  useEffect(() => {
    refetch(queryModel)
  }, [searchQuery, statusFilter, page, pageSize])

  const handleSearchQueryChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInputValue("")
    setStatusFilter("all")
    setPage(1)
  }

  const handleDelete = async (physicianId: string) => {
    if (!confirm("Are you sure you want to delete this physician?")) {
      return
    }

    try {
      setIsDeleting(true)
      await deletePhysician(physicianId)
      toast({
        title: "Success",
        description: "Physician deleted successfully",
      })
      refetch(queryModel)
    } catch (err) {
      console.error("Error deleting physician:", err)
      toast({
        title: "Error",
        description: "Failed to delete physician",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: CustomTableColumn<Physician>[] = [
    {
      key: "name",
      header: "Name",
      render: (physician: Physician) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {physician.firstName} {physician.lastName}
            </div>
            {physician.email && (
              <div className="text-xs text-gray-500">{physician.email}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "specialty",
      header: "Specialty",
      render: (physician: Physician) => (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          {physician.specialty}
        </Badge>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (physician: Physician) => (
        <div className="text-sm">
          {physician.address && (
            <div className="text-gray-900">{physician.address}</div>
          )}
          {(physician.city || physician.state) && (
            <div className="text-gray-500">
              {physician.city}{physician.city && physician.state && ", "}{physician.state}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (physician: Physician) => (
        <span className="text-gray-600">{physician.phone || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (physician: Physician) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={physician.active ? "default" : "secondary"}
            className={
              physician.active
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-600"
            }
          >
            {physician.active ? "Active" : "Inactive"}
          </Badge>
          {physician.isDefault && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Default
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (physician: Physician) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/my-company/physicians/${physician.id}/edit`)}
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
              hover:to-blue-150
              hover:border-blue-300/70
              hover:shadow-md
              hover:shadow-blue-900/10
              hover:-translate-y-0.5
              
              /* Active */
              active:translate-y-0
              active:shadow-sm
              
              /* Transition */
              transition-all
              duration-200
              ease-out
            "
          >
            <Edit2 className="
              h-4 w-4 
              text-blue-600 
              group-hover/edit:text-blue-700
              transition-colors
              duration-200
            " />
          </button>

          <button
            onClick={() => handleDelete(physician.id)}
            disabled={isDeleting}
            className="
              group/delete
              relative
              h-9 w-9
              flex items-center justify-center
              rounded-xl
              
              bg-gradient-to-b from-red-50 to-red-100/80
              border border-red-200/60
              shadow-sm
              shadow-red-900/5
              
              hover:from-red-100
              hover:to-red-150
              hover:border-red-300/70
              hover:shadow-md
              hover:shadow-red-900/10
              hover:-translate-y-0.5
              
              active:translate-y-0
              active:shadow-sm
              
              disabled:opacity-50
              disabled:cursor-not-allowed
              disabled:hover:translate-y-0
              
              transition-all
              duration-200
              ease-out
            "
          >
            <Trash2 className="
              h-4 w-4 
              text-red-600 
              group-hover/delete:text-red-700
              transition-colors
              duration-200
            " />
          </button>
        </div>
      ),
    },
  ]

  return {
    physicians,
    columns,
    isLoading,
    error,
    totalRecords: totalCount,
    currentPage: page,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    searchQuery: inputValue,
    statusFilter,
    setStatusFilter,
    onSearchChange: handleSearchQueryChange,
    onClearFilters: clearFilters,
    refetch: () => refetch(queryModel),
  }
}
