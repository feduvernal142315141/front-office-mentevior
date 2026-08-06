"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarRange, Edit2, FileDown, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import type { MonthlySupervisionListItem } from "@/lib/types/monthly-supervision.types"
import { useMonthlySupervisions } from "@/lib/modules/monthly-supervision/hooks/use-monthly-supervisions"
import { deleteMonthlySupervision } from "@/lib/modules/monthly-supervision/services/monthly-supervision.service"
import {
  formatReportMonthLong,
  toFilterValue,
} from "@/lib/modules/monthly-supervision/utils/report-month"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { cn } from "@/lib/utils"

/**
 * El campo por el que se filtra **no se llama** como el que devuelve el listado
 * (`requestedReportDate`). Es del contrato del 2026-08-05, no un error de acá.
 */
const REPORT_MONTH_FILTER_FIELD = "requestedReportMonthYear"

/**
 * El documento no tiene estatus todavía y se decidió postergarlo (R4).
 * Encenderlo el día que exista el enum es cambiar esto a `true` y agregar el
 * `<FloatingSelect>` de vuelta en la tabla.
 */
export const STATUS_FILTER_ENABLED = false

function formatHours(value?: number): string {
  if (value === undefined || value === null) return "—"
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

export function useMonthlySupervisionTable() {
  const router = useRouter()
  const permission = usePermission()

  // El analista crea, edita y borra; el RBT sólo mira. Gate de UX: el control
  // real lo aplica el backend (exige MONTHLY_SUPERVISIONS_VIEW y permiso DELETE).
  const canCreate = permission.create(PermissionModule.MONTHLY_SUPERVISIONS)
  const canEdit = permission.edit(PermissionModule.MONTHLY_SUPERVISIONS)
  const canDelete = permission.remove(PermissionModule.MONTHLY_SUPERVISIONS)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [filterMonthFrom, setFilterMonthFrom] = useState("")
  const [filterMonthTo, setFilterMonthTo] = useState("")
  const [filterClient, setFilterClient] = useState("all")
  const [filterProvider, setFilterProvider] = useState("all")

  const [previewId, setPreviewId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MonthlySupervisionListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { clients } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { users: allUsers } = useUsers({ pageSize: 100 })

  const clientOptions = useMemo(() => {
    const options = clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName }))
    return [{ value: "all", label: "All Clients" }, ...options]
  }, [clients])

  const providerOptions = useMemo(() => {
    const options = allUsers
      .filter((u) => u.active && !u.terminated)
      .map((u) => ({ value: u.id, label: u.fullName }))
    return [{ value: "all", label: "All Providers" }, ...options]
  }, [allUsers])

  const filters = useMemo(() => {
    const rules: FilterRule[] = []

    // El rango se aplica sobre el mes del reporte, en formato numérico `yyyyMM`.
    if (filterMonthFrom) {
      rules.push({
        field: REPORT_MONTH_FILTER_FIELD,
        operator: FilterOperator.greaterEqual,
        value: toFilterValue(filterMonthFrom),
        type: "number",
        logic: "AND",
      })
    }

    if (filterMonthTo) {
      rules.push({
        field: REPORT_MONTH_FILTER_FIELD,
        operator: FilterOperator.lessEqual,
        value: toFilterValue(filterMonthTo),
        type: "number",
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

    // El provider vive en el propio MonthlySupervision, así que se filtra
    // directo — no hace falta el rodeo por `client.clientProviders` que necesita
    // Clinical Monthly.
    if (filterProvider !== "all") {
      rules.push({
        field: "providerId",
        operator: FilterOperator.eq,
        value: filterProvider,
        type: "uuid",
        logic: "AND",
      })
    }

    const built = buildFilters(rules)
    return built.length > 0 ? built : undefined
  }, [filterMonthFrom, filterMonthTo, filterClient, filterProvider])

  const { items, totalCount, isLoading, error, refetch } = useMonthlySupervisions({
    filters,
    page: page - 1,
    pageSize,
  })

  const hasActiveFilters = !!(
    filterMonthFrom ||
    filterMonthTo ||
    filterClient !== "all" ||
    filterProvider !== "all"
  )

  const clearFilters = useCallback(() => {
    setFilterMonthFrom("")
    setFilterMonthTo("")
    setFilterClient("all")
    setFilterProvider("all")
    setPage(1)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return

    setIsDeleting(true)
    try {
      await deleteMonthlySupervision(pendingDelete.id)
      toast.success("Monthly Supervision deleted")
      setPendingDelete(null)
      // Si era el último de la página, retroceder para no dejar la tabla vacía
      if (items.length === 1 && page > 1) setPage((current) => current - 1)
      else await refetch()
    } catch (err) {
      toast.error("Couldn't delete", {
        description: err instanceof Error ? err.message : "Unexpected error",
      })
    } finally {
      setIsDeleting(false)
    }
  }, [pendingDelete, items.length, page, refetch])

  const columns: CustomTableColumn<MonthlySupervisionListItem>[] = useMemo(() => [
    {
      key: "clientName",
      header: "Client",
      render: (item) => (
        <span className="text-sm font-semibold text-slate-900">{item.clientName || "—"}</span>
      ),
    },
    {
      key: "providerName",
      header: "Supervisee",
      render: (item) => <span className="text-sm text-slate-700">{item.providerName || "—"}</span>,
    },
    {
      key: "requestedReportDate",
      header: "Period",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 shrink-0 text-[#037ECC]" />
          <span className="text-sm text-slate-700">{formatReportMonthLong(item.requestedReportDate)}</span>
        </div>
      ),
    },
    {
      key: "hours",
      header: "Supervised / Total",
      render: (item) => (
        <span className="text-sm tabular-nums text-slate-700">
          {formatHours(item.supervisedHours)} / {formatHours(item.totalHoursWorked)}
        </span>
      ),
    },
    {
      key: "createAt",
      header: "Created",
      render: (item) => (
        <span className="text-sm tabular-nums text-slate-600">
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
            onClick={(event) => {
              event.stopPropagation()
              setPreviewId(item.id)
            }}
            className={cn(
              "group/pdf relative flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-gradient-to-b from-slate-50 to-slate-100/80",
              "border border-slate-200/60 shadow-sm shadow-slate-900/5",
              "hover:from-slate-100 hover:to-slate-200/90 hover:border-slate-300/80",
              "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:ring-offset-2",
            )}
            title="Preview PDF"
            aria-label="Preview PDF"
          >
            <FileDown className="h-4 w-4 text-slate-600 transition-colors group-hover/pdf:text-slate-800" />
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                router.push(`/monthly-supervisions/${item.id}/edit`)
              }}
              className={cn(
                "group/edit relative flex h-9 w-9 items-center justify-center rounded-xl",
                "bg-gradient-to-b from-blue-50 to-blue-100/80",
                "border border-blue-200/60 shadow-sm shadow-blue-900/5",
                "hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300/80",
                "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2",
              )}
              title="Edit"
              aria-label="Edit"
            >
              <Edit2 className="h-4 w-4 text-blue-600 transition-colors group-hover/edit:text-blue-700" />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setPendingDelete(item)
              }}
              className={cn(
                "group/del relative flex h-9 w-9 items-center justify-center rounded-xl",
                "bg-gradient-to-b from-red-50 to-red-100/80",
                "border border-red-200/60 shadow-sm shadow-red-900/5",
                "hover:from-red-100 hover:to-red-200/90 hover:border-red-300/80",
                "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2",
              )}
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-600 transition-colors group-hover/del:text-red-700" />
            </button>
          )}
        </div>
      ),
    },
  ], [canEdit, canDelete, router])

  return {
    data: items,
    columns,
    isLoading,
    error,
    filters: {
      filterMonthFrom,
      filterMonthTo,
      filterClient,
      filterProvider,
      onMonthFromChange: (value: string) => { setFilterMonthFrom(value); setPage(1) },
      onMonthToChange: (value: string) => { setFilterMonthTo(value); setPage(1) },
      onClientChange: (value: string) => { setFilterClient(value); setPage(1) },
      onProviderChange: (value: string) => { setFilterProvider(value); setPage(1) },
    },
    clientOptions,
    providerOptions,
    hasActiveFilters,
    clearFilters,
    pagination: {
      page,
      pageSize,
      total: totalCount,
      onPageChange: setPage,
      onPageSizeChange: (size: number) => { setPageSize(size); setPage(1) },
      pageSizeOptions: [10, 20, 50],
    },
    previewId,
    setPreviewId,
    pendingDelete,
    setPendingDelete,
    confirmDelete,
    isDeleting,
    canCreate,
    canEdit,
    goToCreate: () => router.push("/monthly-supervisions/create"),
  }
}
