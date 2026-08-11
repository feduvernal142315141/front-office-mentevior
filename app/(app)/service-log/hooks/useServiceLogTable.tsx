"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarRange, Eye, FileDown } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { ServiceLogListItem } from "@/lib/types/service-log.types"
import { useServiceLogs } from "@/lib/modules/service-log/hooks/use-service-logs"
import {
  DEFAULT_ORDERS,
  clientFilter,
  endDateToFilter,
  initDateFromFilter,
  providerFilter,
} from "@/lib/modules/service-log/utils/filters"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { parseLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

function formatDay(value: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value), "MM/dd/yyyy")
  } catch {
    return value
  }
}

export function useServiceLogTable(reloadKey: number) {
  const router = useRouter()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")
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
    return [{ value: "all", label: "All Providers" }, ...options]
  }, [allUsers])

  const filters = useMemo(() => {
    const rules: FilterRule[] = []

    if (filterFrom) rules.push(initDateFromFilter(filterFrom))
    if (filterTo) rules.push(endDateToFilter(filterTo))
    if (filterClient !== "all") rules.push(clientFilter(filterClient))
    if (filterProvider !== "all") rules.push(providerFilter(filterProvider))

    const built = buildFilters(rules)
    return built.length > 0 ? built : undefined
  }, [filterFrom, filterTo, filterClient, filterProvider])

  const { items, totalCount, isLoading, error, refetch } = useServiceLogs({
    filters,
    orders: DEFAULT_ORDERS,
    page: page - 1,
    pageSize,
    reloadKey,
  })

  const hasActiveFilters = !!(
    filterFrom ||
    filterTo ||
    filterClient !== "all" ||
    filterProvider !== "all"
  )

  const clearFilters = useCallback(() => {
    setFilterFrom("")
    setFilterTo("")
    setFilterClient("all")
    setFilterProvider("all")
    setPage(1)
  }, [])

  const columns: CustomTableColumn<ServiceLogListItem>[] = useMemo(
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
        header: "Provider",
        render: (item) => <span className="text-sm text-slate-700">{item.providerName || "—"}</span>,
      },
      {
        key: "period",
        header: "Period",
        render: (item) => (
          <div className="flex items-center gap-1.5">
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-[#037ECC]" />
            <span className="whitespace-nowrap text-sm tabular-nums text-slate-700">
              {formatDay(item.initDate)} – {formatDay(item.endDate)}
            </span>
          </div>
        ),
      },
      {
        key: "createAt",
        header: "Generated",
        render: (item) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-slate-500">
            {formatDay(item.createAt)}
          </span>
        ),
      },
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
              title="View service log"
              onClick={(event) => {
                event.stopPropagation()
                router.push(`/service-log/${item.id}`)
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
    refetch,
    filters: {
      filterFrom,
      filterTo,
      filterClient,
      filterProvider,
      onFromChange: (value: string) => { setFilterFrom(value); setPage(1) },
      onToChange: (value: string) => { setFilterTo(value); setPage(1) },
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
    goToDetail: (item: ServiceLogListItem) => router.push(`/service-log/${item.id}`),
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
