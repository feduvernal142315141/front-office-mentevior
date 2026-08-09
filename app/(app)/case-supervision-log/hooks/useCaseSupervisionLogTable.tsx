"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarRange, Eye, FileDown } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule } from "@/lib/utils/permissions-new"
import type { CaseSupervisionLogListItem } from "@/lib/types/case-supervision-log.types"
import { useCaseSupervisionLogs } from "@/lib/modules/case-supervision-log/hooks/use-case-supervision-logs"
import {
  DEFAULT_ORDERS,
  clientFilter,
  monthFromFilter,
  monthToFilter,
  providerFilter,
} from "@/lib/modules/case-supervision-log/utils/filters"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { formatReportMonthLong } from "@/lib/utils/report-month"
import { cn } from "@/lib/utils"

export function useCaseSupervisionLogTable() {
  const router = useRouter()
  const permission = usePermission()

  // Gate de UX: el control real lo aplica el backend, que exige el módulo
  // `supervision` con READ para listar y CREATE para crear.
  const canCreate = permission.create(PermissionModule.SUPERVISION)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [filterMonthFrom, setFilterMonthFrom] = useState("")
  const [filterMonthTo, setFilterMonthTo] = useState("")
  const [filterClient, setFilterClient] = useState("all")
  const [filterProvider, setFilterProvider] = useState("all")

  const [previewId, setPreviewId] = useState<string | null>(null)

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
    return [{ value: "all", label: "All Supervisors" }, ...options]
  }, [allUsers])

  const filters = useMemo(() => {
    const rules: FilterRule[] = []

    if (filterMonthFrom) rules.push(monthFromFilter(filterMonthFrom))
    if (filterMonthTo) rules.push(monthToFilter(filterMonthTo))
    if (filterClient !== "all") rules.push(clientFilter(filterClient))
    if (filterProvider !== "all") rules.push(providerFilter(filterProvider))

    const built = buildFilters(rules)
    return built.length > 0 ? built : undefined
  }, [filterMonthFrom, filterMonthTo, filterClient, filterProvider])

  const { items, totalCount, isLoading, error } = useCaseSupervisionLogs({
    filters,
    orders: DEFAULT_ORDERS,
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

  const columns: CustomTableColumn<CaseSupervisionLogListItem>[] = useMemo(
    () => [
      {
        key: "clientName",
        header: "Client",
        render: (item) => (
          <span className="text-sm font-semibold text-slate-900">{item.clientName || "—"}</span>
        ),
      },
      {
        key: "providerName",
        header: "Supervisor",
        render: (item) => <span className="text-sm text-slate-700">{item.providerName || "—"}</span>,
      },
      {
        key: "monthYear",
        header: "Period",
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-[#037ECC]" />
            <span className="text-sm text-slate-700">{formatReportMonthLong(item.monthYear)}</span>
          </div>
        ),
      },
      /*
       * No hay columnas de horas ni de cumplimiento.
       *
       * El listado del backend **no devuelve `totalsHours` ni `supervisionHours`**
       * (confirmado el 2026-08-08), así que esas dos columnas mostrarían un guion
       * en todas las filas siempre. Una columna permanentemente vacía se lee como
       * "falta cargar esto" y ensucia la tabla sin aportar.
       *
       * El tipo mantiene los campos como opcionales: el día que el backend los
       * mande, volver a agregar las columnas es sólo esto de vuelta. Mientras
       * tanto el porcentaje y el Met/Unmet viven en el detalle y en el PDF, que
       * es donde sí existe el dato.
       */
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (item) => (
          <div className="flex items-center justify-end gap-2">
            <IconButton
              tone="slate"
              title="Preview PDF"
              onClick={(event) => {
                event.stopPropagation()
                setPreviewId(item.id)
              }}
            >
              <FileDown className="h-4 w-4" />
            </IconButton>

            <IconButton
              tone="blue"
              title="View report"
              onClick={(event) => {
                event.stopPropagation()
                router.push(`/case-supervision-log/${item.id}`)
              }}
            >
              <Eye className="h-4 w-4" />
            </IconButton>
          </div>
        ),
      },
    ],
    [router],
  )

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
      // El picker emite los dos extremos juntos: un solo cambio de estado, una
      // sola consulta. Con dos campos separados, elegir un rango disparaba dos.
      onMonthRangeChange: (from: string, to: string) => {
        setFilterMonthFrom(from)
        setFilterMonthTo(to)
        setPage(1)
      },
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
    canCreate,
    goToCreate: () => router.push("/case-supervision-log/create"),
    goToDetail: (item: CaseSupervisionLogListItem) =>
      router.push(`/case-supervision-log/${item.id}`),
  }
}

const TONE_STYLES = {
  slate: "from-slate-50 to-slate-100/80 border-slate-200/60 shadow-slate-900/5 hover:from-slate-100 hover:to-slate-200/90 hover:border-slate-300/80 text-slate-600 focus:ring-slate-500/30",
  blue: "from-blue-50 to-blue-100/80 border-blue-200/60 shadow-blue-900/5 hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300/80 text-blue-600 focus:ring-blue-500/30",
} as const

function IconButton({
  tone,
  title,
  onClick,
  children,
}: {
  tone: keyof typeof TONE_STYLES
  title: string
  onClick: (event: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl",
        "border bg-gradient-to-b shadow-sm",
        "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        TONE_STYLES[tone],
      )}
    >
      {children}
    </button>
  )
}
