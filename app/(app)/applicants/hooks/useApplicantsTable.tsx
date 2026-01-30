"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { Applicant } from "@/lib/types/applicant.types"
import { useApplicants } from "@/lib/modules/applicants/hooks/use-applicants"
import { Badge } from "@/components/ui/badge"
import { Eye, UserCheck } from "lucide-react"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { buildFilters } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { cn } from "@/lib/utils"

export function useApplicantsTable() {
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [inputValue, setInputValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const filters = buildFilters(
    [
      statusFilter === "read" ? { field: "isRead", operator: FilterOperator.Equals, value: true, type: "boolean" as const } : null,
      statusFilter === "unread" ? { field: "isRead", operator: FilterOperator.Equals, value: false, type: "boolean" as const } : null,
    ].filter((f): f is NonNullable<typeof f> => f !== null),
    searchQuery ? { fields: ["firstName", "lastName", "emailAddress"], search: searchQuery } : undefined
  )

  const queryModel = {
    page,
    pageSize,
    filters,
  }

  const { applicants, totalCount, isLoading, error, refetch } = useApplicants(queryModel)

  useEffect(() => {
    setPage(0)
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
    setPage(0)
    console.log("Filters cleared" )
  }

  const handleViewDetails = (applicant: Applicant) => {
    router.push(`/applicants/${applicant.id}`)
  }

  const columns: CustomTableColumn<Applicant>[] = [
    {
      key: "name",
      header: "Name",
      render: (applicant: Applicant) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-600">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className={cn(
              "text-gray-900",
              !applicant.isRead && "font-bold"
            )}>
              {applicant.firstName} {applicant.lastName}
            </div>
            {!applicant.isRead && (
              <Badge variant="default" className="mt-1 bg-blue-500 text-white text-[10px] px-1.5 py-0">
                NEW
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (applicant: Applicant) => (
        <span className={cn(
          "text-gray-600",
          !applicant.isRead && "font-semibold text-gray-900"
        )}>
          {applicant.emailAddress}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (applicant: Applicant) => (
        <span className={cn(
          "text-gray-600",
          !applicant.isRead && "font-semibold text-gray-900"
        )}>
          {applicant.phoneNumber}
        </span>
      ),
    },
    {
      key: "certification",
      header: "Certification",
      render: (applicant: Applicant) => (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {applicant.currentCertification}
        </Badge>
      ),
    },
    {
      key: "licenseNumber",
      header: "License Number",
      render: (applicant: Applicant) => (
        <span className={cn(
          "text-gray-600",
          !applicant.isRead && "font-semibold text-gray-900"
        )}>
          {applicant.licenseNumber}
        </span>
      ),
    },
    {
      key: "licenseExpirationDate",
      header: "License Exp. Date",
      render: (applicant: Applicant) => {
        const dateValue = applicant.licenseExpirationDate || applicant.licenceExpirationDate
        if (!dateValue) {
          return <span className="text-gray-400">-</span>
        }
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) {
          return <span className="text-gray-400">-</span>
        }
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
        return (
          <span className={cn(
            "text-gray-600",
            !applicant.isRead && "font-semibold text-gray-900"
          )}>
            {formattedDate}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (applicant: Applicant) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleViewDetails(applicant)}
            className="
              group/view
              relative
              h-9 w-9
              flex items-center justify-center
              rounded-xl
              
              /* Background gradient */
              bg-gradient-to-b from-[#037ECC]/10 to-[#079CFB]/10
              
              /* Border */
              border border-[#037ECC]/20
              
              /* Shadow */
              shadow-sm
              shadow-[#037ECC]/5
              
              /* Hover */
              hover:from-[#037ECC]/20
              hover:to-[#079CFB]/20
              hover:border-[#037ECC]/30
              hover:shadow-md
              hover:shadow-[#037ECC]/10
              hover:-translate-y-0.5
              
              /* Active */
              active:translate-y-0
              active:shadow-sm
              
              /* Transition */
              transition-all
              duration-200
              ease-out
            "
            title="View Details"
          >
            <Eye className="
              h-4 w-4 
              text-[#037ECC]
              group-hover/view:text-[#037ECC]
              transition-colors
              duration-200
            " />
          </button>
        </div>
      ),
    },
  ]

  return {
    applicants,
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
