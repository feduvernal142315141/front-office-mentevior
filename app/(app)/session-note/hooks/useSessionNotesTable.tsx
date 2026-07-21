"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Edit2, Trash2 } from "lucide-react"
import type { CustomTableColumn } from "@/components/custom/CustomTable"
import type { AppointmentNoteSummary } from "@/lib/types/appointment-note.types"
import { useAppointmentNotes } from "@/lib/modules/appointment-notes/hooks/use-appointment-notes"
import { buildFilters, type FilterRule } from "@/lib/utils/query-filters"
import { FilterOperator } from "@/lib/models/filterOperator"
import { parseLocalDate } from "@/lib/date"
import { cn } from "@/lib/utils"

export function useSessionNotesTable() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Filters
  const [filterDate, setFilterDate] = useState("")
  const [filterClient, setFilterClient] = useState("")
  const [filterProvider, setFilterProvider] = useState("")
  const [filterBillingCode, setFilterBillingCode] = useState("")

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

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

    if (filterClient.trim()) {
      rules.push({
        field: "appointment.clientName",
        operator: FilterOperator.relatedContains,
        value: filterClient.trim(),
        logic: "AND",
      })
    }

    if (filterProvider.trim()) {
      const parts = filterProvider.trim().split(/\s+/)
      rules.push({
        field: "appointment.provider.firstName",
        operator: FilterOperator.relatedContains,
        value: parts[0],
        logic: "AND",
      })
      if (parts.length > 1) {
        rules.push({
          field: "appointment.provider.lastName",
          operator: FilterOperator.relatedContains,
          value: parts.slice(1).join(" "),
          logic: "AND",
        })
      }
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
    page,
    pageSize,
  })

  const hasActiveFilters = !!(filterDate || filterClient.trim() || filterProvider.trim() || filterBillingCode.trim())

  const handleDateChange = (v: string) => { setFilterDate(v); setPage(0) }
  const handleClientChange = (v: string) => { setFilterClient(v); setPage(0) }
  const handleProviderChange = (v: string) => { setFilterProvider(v); setPage(0) }
  const handleBillingCodeChange = (v: string) => { setFilterBillingCode(v); setPage(0) }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const clearFilters = useCallback(() => {
    setFilterDate("")
    setFilterClient("")
    setFilterProvider("")
    setFilterBillingCode("")
    setPage(0)
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
      key: "actions",
      header: "Actions",
      align: "right",
      render: (note) => (
        <div className="flex items-center justify-end gap-2">
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
          <button
            type="button"
            onClick={() => setDeleteTarget({ id: note.id, name: note.clientName })}
            className={cn(
              "group/del relative h-9 w-9",
              "flex items-center justify-center rounded-xl",
              "bg-gradient-to-b from-red-50 to-red-100/80",
              "border border-red-200/60 shadow-sm shadow-red-900/5",
              "hover:from-red-100 hover:to-red-200/90",
              "hover:border-red-300/80 hover:shadow-md hover:shadow-red-900/10",
              "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2",
            )}
            title="Delete session note"
            aria-label="Delete session note"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500 group-hover/del:text-red-600 transition-colors duration-200" />
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
    deleteTarget,
    setDeleteTarget,
    handleOpenNote,
  }
}
