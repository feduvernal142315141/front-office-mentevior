"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Edit2, FileDown } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import type { AssessmentListItem } from "@/lib/types/assessment.types"
import { HOUSING_TYPE_LABELS } from "@/lib/constants/assessment.constants"
import { useAssessments } from "@/lib/modules/assessments/hooks/use-assessments"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { cn } from "@/lib/utils"
import { ASSESSMENT_STATUS_BADGE } from "./useAssessmentStatus"

export function useAssessmentsTable() {
  const router = useRouter()
  const permission = usePermission()

  const canCreate = permission.create(PermissionModule.ASSESSMENT)
  const canEdit = permission.edit(PermissionModule.ASSESSMENT)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filtros vía el mecanismo dinámico estándar del backend: rango sobre
  // `createAt` (campo del response del listado) + cliente. Mismo trío
  // From/To/Client que Service Log y Clinical Monthly.
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterClient, setFilterClient] = useState("all")

  const [previewId, setPreviewId] = useState<string | null>(null)

  const { clients } = useClientsByLoggedUser({ page: 0, pageSize: 200 })

  const clientOptions = useMemo(() => {
    const opts = clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName }))
    return [{ value: "all", label: "All Clients" }, ...opts]
  }, [clients])

  const filters = useMemo(() => {
    const rules: FilterRule[] = []

    if (filterDateFrom) {
      rules.push({
        field: "createAt",
        operator: FilterOperator.greaterEqual,
        value: filterDateFrom,
        type: "date",
        logic: "AND",
      })
    }

    if (filterDateTo) {
      rules.push({
        field: "createAt",
        operator: FilterOperator.lessEqual,
        value: filterDateTo,
        type: "date",
        logic: "AND",
      })
    }

    if (filterClient !== "all") {
      rules.push({
        field: "clientId",
        operator: FilterOperator.eq,
        value: filterClient,
        type: "uuid",
        logic: "AND",
      })
    }

    const built = buildFilters(rules)
    return built.length > 0 ? built : undefined
  }, [filterDateFrom, filterDateTo, filterClient])

  const { assessments, totalCount, isLoading, error, refetch } = useAssessments({
    filters,
    page: page - 1,
    pageSize,
  })

  const hasActiveFilters = !!(filterDateFrom || filterDateTo || filterClient !== "all")

  const handleDateFromChange = (v: string) => { setFilterDateFrom(v); setPage(1) }
  const handleDateToChange = (v: string) => { setFilterDateTo(v); setPage(1) }
  const handleClientChange = (v: string) => { setFilterClient(v); setPage(1) }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const clearFilters = useCallback(() => {
    setFilterDateFrom("")
    setFilterDateTo("")
    setFilterClient("all")
    setPage(1)
  }, [])

  const columns: CustomTableColumn<AssessmentListItem>[] = useMemo(() => [
    {
      key: "clientName",
      header: "Client",
      render: (item) => (
        <span className="text-sm font-semibold text-slate-900">{item.clientName || "—"}</span>
      ),
    },
    {
      key: "schoolName",
      header: "School",
      render: (item) => (
        <span className="block max-w-[220px] truncate text-sm text-slate-700" title={item.schoolName}>
          {item.schoolName || "—"}
        </span>
      ),
    },
    {
      key: "gradeName",
      header: "Grade",
      className: "whitespace-nowrap",
      render: (item) => <span className="text-sm text-slate-700">{item.gradeName || "—"}</span>,
    },
    {
      key: "housingType",
      header: "Housing",
      className: "whitespace-nowrap",
      render: (item) => (
        <span className="text-sm text-slate-700">
          {item.housingType ? HOUSING_TYPE_LABELS[item.housingType] : "—"}
        </span>
      ),
    },
    {
      key: "medicalHistoryPrimaryDiagnosisName",
      header: "Primary Diagnosis",
      render: (item) => (
        <span className="block max-w-[240px] truncate text-sm text-slate-700" title={item.medicalHistoryPrimaryDiagnosisName ?? undefined}>
          {item.medicalHistoryPrimaryDiagnosisName || "—"}
        </span>
      ),
    },
    {
      key: "createAt",
      header: "Created",
      className: "whitespace-nowrap",
      render: (item) => (
        <span className="text-sm text-slate-600 tabular-nums">
          {item.createAt ? format(new Date(item.createAt), "MM/dd/yyyy") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      className: "whitespace-nowrap",
      render: (item) => {
        const badge = ASSESSMENT_STATUS_BADGE[item.status] ?? ASSESSMENT_STATUS_BADGE.active
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewId(item.id)
            }}
            className={cn(
              "group/pdf relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-slate-50 to-slate-100/80",
              "border border-slate-200/60 shadow-sm shadow-slate-900/5",
              "hover:from-slate-100 hover:to-slate-200/90",
              "hover:border-slate-300/80 hover:shadow-md hover:shadow-slate-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:ring-offset-2",
            )}
            title="Preview PDF"
            aria-label="Preview PDF"
          >
            <FileDown className="w-4 h-4 text-slate-600 group-hover/pdf:text-slate-800 transition-colors duration-200" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/assessment/${item.id}/edit`)
              }}
              className={cn(
                "group/edit relative h-9 w-9",
                "flex items-center justify-center rounded-xl",
                "bg-gradient-to-b from-blue-50 to-blue-100/80",
                "border border-blue-200/60 shadow-sm shadow-blue-900/5",
                "hover:from-blue-100 hover:to-blue-200/90",
                "hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10",
                "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2",
              )}
              title="Edit"
              aria-label="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
            </button>
          )}
        </div>
      ),
    },
  ], [canEdit, router])

  return {
    data: assessments,
    columns,
    isLoading,
    error,
    refetch,
    filters: {
      filterDateFrom,
      filterDateTo,
      filterClient,
      onDateFromChange: handleDateFromChange,
      onDateToChange: handleDateToChange,
      onClientChange: handleClientChange,
    },
    clientOptions,
    hasActiveFilters,
    clearFilters,
    previewId,
    setPreviewId,
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: setPage,
      onPageSizeChange: handlePageSizeChange,
      pageSizeOptions: [10, 20, 50],
    },
    canCreate,
    canEdit,
    goToCreate: () => router.push("/assessment/create"),
  }
}
