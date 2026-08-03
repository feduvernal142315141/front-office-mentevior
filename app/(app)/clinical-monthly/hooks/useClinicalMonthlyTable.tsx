"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Calendar, Edit2, FileDown } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import type { ClinicalMonthlyListItem, ClinicalMonthlyStatus } from "@/lib/types/clinical-monthly.types"
import { useClinicalMonthlies } from "@/lib/modules/clinical-monthly/hooks/use-clinical-monthlies"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { parseLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

/**
 * El Clinical Monthly no tiene provider propio: el provider es el usuario
 * logueado que lo crea. Por eso filtrar "por Provider" significa quedarse con
 * los reportes de los clientes que tienen ese provider asignado, navegando la
 * relación `client.clientProviders.providerId` (formato confirmado por backend).
 */
const PROVIDER_FILTER_FIELD = "client.clientProviders.providerId"

/** El listado todavía no devuelve `status` (gap B2 del plan) */
export const STATUS_FILTER_ENABLED = false

const STATUS_CONFIG: Record<ClinicalMonthlyStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-50 border-slate-200 text-slate-600" },
  COMPLETED: { label: "Completed", className: "bg-blue-50 border-blue-100 text-blue-700" },
  SIGNED: { label: "Signed", className: "bg-emerald-50 border-emerald-100 text-emerald-700" },
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...(Object.keys(STATUS_CONFIG) as ClinicalMonthlyStatus[]).map((key) => ({
    value: key,
    label: STATUS_CONFIG[key].label,
  })),
]

function formatDate(value?: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value), "MM/dd/yyyy")
  } catch {
    return "—"
  }
}

export function useClinicalMonthlyTable() {
  const router = useRouter()
  const permission = usePermission()

  // El analista crea y edita; el RBT sólo mira. El gate del front es UX:
  // el control real lo tiene que hacer el backend.
  const canCreate = permission.create(PermissionModule.CLINICAL_MONTHLY)
  const canEdit = permission.edit(PermissionModule.CLINICAL_MONTHLY)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filtros que pide la HU: rango de fecha, provider, cliente y estatus
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterClient, setFilterClient] = useState("all")
  const [filterProvider, setFilterProvider] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [previewId, setPreviewId] = useState<string | null>(null)

  const { clients } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { users: allUsers } = useUsers({ pageSize: 100 })

  const clientOptions = useMemo(() => {
    const opts = clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName }))
    return [{ value: "all", label: "All Clients" }, ...opts]
  }, [clients])

  const providerOptions = useMemo(() => {
    const opts = allUsers.filter((u) => u.active && !u.terminated).map((u) => ({ value: u.id, label: u.fullName }))
    return [{ value: "all", label: "All Providers" }, ...opts]
  }, [allUsers])

  const statusOptions = STATUS_OPTIONS

  const filters = useMemo(() => {
    const rules: FilterRule[] = []

    // El rango se aplica sobre el período del reporte, no sobre `createAt`:
    // entra el Clinical Monthly cuyo período cae completo dentro del rango.
    if (filterDateFrom) {
      rules.push({
        field: "startDate",
        operator: FilterOperator.greaterEqual,
        value: filterDateFrom,
        type: "date",
        logic: "AND",
      })
    }

    if (filterDateTo) {
      rules.push({
        field: "endDate",
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

    if (filterProvider !== "all") {
      rules.push({
        field: PROVIDER_FILTER_FIELD,
        operator: FilterOperator.relatedEqual,
        value: filterProvider,
        type: "uuid",
        logic: "AND",
      })
    }

    if (STATUS_FILTER_ENABLED && filterStatus !== "all") {
      rules.push({
        field: "status",
        operator: FilterOperator.eq,
        value: filterStatus,
        logic: "AND",
      })
    }

    const built = buildFilters(rules)
    return built.length > 0 ? built : undefined
  }, [filterDateFrom, filterDateTo, filterClient, filterProvider, filterStatus])

  const { clinicalMonthlies, totalCount, isLoading, error } = useClinicalMonthlies({
    filters,
    page: page - 1,
    pageSize,
  })

  const hasActiveFilters = !!(
    filterDateFrom ||
    filterDateTo ||
    filterClient !== "all" ||
    filterProvider !== "all" ||
    filterStatus !== "all"
  )

  const handleDateFromChange = (v: string) => { setFilterDateFrom(v); setPage(1) }
  const handleDateToChange = (v: string) => { setFilterDateTo(v); setPage(1) }
  const handleClientChange = (v: string) => { setFilterClient(v); setPage(1) }
  const handleProviderChange = (v: string) => { setFilterProvider(v); setPage(1) }
  const handleStatusChange = (v: string) => { setFilterStatus(v); setPage(1) }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const clearFilters = useCallback(() => {
    setFilterDateFrom("")
    setFilterDateTo("")
    setFilterClient("all")
    setFilterProvider("all")
    setFilterStatus("all")
    setPage(1)
  }, [])

  // El listado no devuelve `providerName` todavía; la columna aparece sola en
  // cuanto el backend lo mande, en vez de ocupar espacio con guiones.
  const showProviderColumn = useMemo(
    () => clinicalMonthlies.some((item) => !!item.providerName),
    [clinicalMonthlies],
  )

  const columns: CustomTableColumn<ClinicalMonthlyListItem>[] = useMemo(() => [
    {
      key: "clientName",
      header: "Client",
      render: (item) => (
        <span className="text-sm font-semibold text-slate-900">{item.clientName || "—"}</span>
      ),
    },
    ...(showProviderColumn
      ? [{
          key: "providerName",
          header: "Provider",
          render: (item: ClinicalMonthlyListItem) => (
            <span className="text-sm text-slate-700">{item.providerName || "—"}</span>
          ),
        }]
      : []),
    {
      key: "period",
      header: "Period",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-[#037ECC] shrink-0" />
          <span className="text-sm text-slate-700 tabular-nums">
            {formatDate(item.startDate)} – {formatDate(item.endDate)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const config = item.status ? STATUS_CONFIG[item.status] : null
        if (!config) {
          return <span className="text-sm text-slate-400">—</span>
        }
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: "createAt",
      header: "Created",
      render: (item) => (
        <span className="text-sm text-slate-600 tabular-nums">
          {item.createAt ? format(new Date(item.createAt), "MM/dd/yyyy") : "—"}
        </span>
      ),
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
                router.push(`/clinical-monthly/${item.id}/edit`)
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
  ], [showProviderColumn, canEdit, router])

  return {
    data: clinicalMonthlies,
    columns,
    isLoading,
    error,
    filters: {
      filterDateFrom,
      filterDateTo,
      filterClient,
      filterProvider,
      filterStatus,
      onDateFromChange: handleDateFromChange,
      onDateToChange: handleDateToChange,
      onClientChange: handleClientChange,
      onProviderChange: handleProviderChange,
      onStatusChange: handleStatusChange,
    },
    clientOptions,
    providerOptions,
    statusOptions,
    hasActiveFilters,
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: setPage,
      onPageSizeChange: handlePageSizeChange,
      pageSizeOptions: [10, 20, 50],
    },
    clearFilters,
    previewId,
    setPreviewId,
    canCreate,
    canEdit,
    goToCreate: () => router.push("/clinical-monthly/create"),
  }
}
