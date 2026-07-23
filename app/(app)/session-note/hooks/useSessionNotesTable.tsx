"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Edit2, FileDown } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { AppointmentNoteSummary } from "@/lib/types/appointment-note.types"
import { useAppointmentNotes } from "@/lib/modules/appointment-notes/hooks/use-appointment-notes"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { parseLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

export function useSessionNotesTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filters
  const [filterDate, setFilterDate] = useState("")
  const [filterClient, setFilterClient] = useState("all")
  const [filterProvider, setFilterProvider] = useState("all")
  const [filterBillingCode, setFilterBillingCode] = useState("")

  // Options for selects
  const { clients } = useClientsByLoggedUser({ page: 0, pageSize: 200 })
  const { users: allUsers } = useUsers({ pageSize: 100 })

  const clientOptions = useMemo(() => {
    const opts = clients.filter((c) => c.fullName).map((c) => ({ value: c.id, label: c.fullName }))
    return [{ value: "all", label: "All Clients" }, ...opts]
  }, [clients])

  const providerOptions = useMemo(() => {
    const opts = allUsers.filter((u) => u.active && !u.terminated && u.roleName).map((u) => ({ value: u.id, label: u.fullName }))
    return [{ value: "all", label: "All Providers" }, ...opts]
  }, [allUsers])

  // PDF Preview
  const [previewAppointmentId, setPreviewAppointmentId] = useState<string | null>(null)

  const filters = useMemo(() => {
    const rules: FilterRule[] = []

    if (filterDate) {
      rules.push({
        field: "appointment.date",
        operator: FilterOperator.relatedEqual,
        value: `Date:${filterDate}`,
        logic: "AND",
      })
    }

    if (filterClient !== "all") {
      rules.push({
        field: "appointment.clientId",
        operator: FilterOperator.relatedEqual,
        value: filterClient,
        type: "uuid",
        logic: "AND",
      })
    }

    if (filterProvider !== "all") {
      rules.push({
        field: "appointment.providerId",
        operator: FilterOperator.relatedEqual,
        value: filterProvider,
        type: "uuid",
        logic: "AND",
      })
    }

    if (filterBillingCode.trim()) {
      rules.push({
        field: "appointment.billingCode.code",
        operator: FilterOperator.relatedContains,
        value: filterBillingCode.trim(),
        logic: "AND",
      })
    }

    const built = buildFilters(rules)
    return built.length > 0 ? built : undefined
  }, [filterDate, filterClient, filterProvider, filterBillingCode])

  const { notes, pagination, isLoading, error } = useAppointmentNotes({
    filters,
    page: page - 1,
    pageSize,
  })

  const hasActiveFilters = !!(filterDate || filterClient !== "all" || filterProvider !== "all" || filterBillingCode.trim())

  const handleDateChange = (v: string) => { setFilterDate(v); setPage(1) }
  const handleClientChange = (v: string) => { setFilterClient(v); setPage(1) }
  const handleProviderChange = (v: string) => { setFilterProvider(v); setPage(1) }
  const handleBillingCodeChange = (v: string) => { setFilterBillingCode(v); setPage(1) }


  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const clearFilters = useCallback(() => {
    setFilterDate("")
    setFilterClient("all")
    setFilterProvider("all")
    setFilterBillingCode("")
    setPage(1)
  }, [])

  const handleOpenNote = useCallback((appointmentId: string, billingCode: string) => {
    router.push(`/session-note?appointmentId=${appointmentId}&billingCode=${encodeURIComponent(billingCode)}`)
  }, [router])

  const columns: CustomTableColumn<AppointmentNoteSummary>[] = useMemo(() => [
    {
      key: "clientName",
      header: "Client",
      render: (note) => (
        <span className="text-sm font-semibold text-slate-900">{note.clientName}</span>
      ),
    },
    {
      key: "providerName",
      header: "Provider",
      render: (note) => (
        <span className="text-sm text-slate-700">{note.providerName}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (note) => (
        <span className="text-sm text-slate-600 tabular-nums">
          {note.date ? format(parseLocalDate(note.date), "MM/dd/yyyy") : "—"}
        </span>
      ),
    },
    {
      key: "billingCode",
      header: "Billing Code",
      render: (note) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {note.billingCode || "—"}
        </span>
      ),
    },
    {
      key: "noteStatus",
      header: "Status",
      render: (note) => {
        const config: Record<string, { label: string; className: string }> = {
          read: { label: "Read Only", className: "bg-blue-50 border-blue-100 text-blue-700" },
          active: { label: "Active", className: "bg-emerald-50 border-emerald-100 text-emerald-700" },
          close: { label: "Closed", className: "bg-amber-50 border-amber-100 text-amber-700" },
          lock: { label: "Locked", className: "bg-red-50 border-red-100 text-red-700" },
        }
        const s = config[note.noteStatus ?? "read"] ?? config.read
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
            {s.label}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (note) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPreviewAppointmentId(note.appointmentId)}
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
          <button
            type="button"
            onClick={() => handleOpenNote(note.appointmentId, note.billingCode)}
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
            title="Edit session note"
            aria-label="Edit session note"
          >
            <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
          </button>
        </div>
      ),
    },
  ], [handleOpenNote])

  return {
    data: notes,
    columns,
    isLoading,
    error,
    filters: {
      filterDate,
      filterClient,
      filterProvider,
      filterBillingCode,
      onDateChange: handleDateChange,
      onClientChange: handleClientChange,
      onProviderChange: handleProviderChange,
      onBillingCodeChange: handleBillingCodeChange,
    },
    clientOptions,
    providerOptions,
    hasActiveFilters,
    pagination: {
      page,
      pageSize,
      total: pagination.total,
      onPageChange: setPage,
      onPageSizeChange: handlePageSizeChange,
      pageSizeOptions: [10, 20, 50],
    },
    clearFilters,
    previewAppointmentId,
    setPreviewAppointmentId,
    handleOpenNote,
  }
}
