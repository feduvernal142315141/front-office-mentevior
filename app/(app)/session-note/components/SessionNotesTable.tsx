"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { FileText, ChevronLeft, ChevronRight, Loader2, Trash2, X } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { useAppointmentNotes } from "@/lib/modules/appointment-notes/hooks/use-appointment-notes"
import { cn } from "@/lib/utils"
import { parseLocalDate } from "@/app/(app)/clients/[id]/configuration/components/datasheets/datasheet-utils"

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "Session Note", label: "Session Note" },
  { value: "Supervision", label: "Supervision" },
  { value: "Service Plan", label: "Service Plan" },
]

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
  { value: "Signed", label: "Signed" },
]

export function SessionNotesTable() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Filters
  const [filterDate, setFilterDate] = useState("")
  const [filterClient, setFilterClient] = useState("")
  const [filterProvider, setFilterProvider] = useState("")
  const [filterBillingCode, setFilterBillingCode] = useState("")
  const [filterEventType, setFilterEventType] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const filters = useMemo(() => {
    const f: string[] = []
    if (filterDate) f.push(`date__EQ__date:${filterDate}__AND`)
    if (filterClient.trim()) f.push(`clientName__LIKE__${filterClient.trim()}__AND`)
    if (filterProvider.trim()) f.push(`providerName__LIKE__${filterProvider.trim()}__AND`)
    if (filterBillingCode.trim()) f.push(`billingCode__LIKE__${filterBillingCode.trim()}__AND`)
    if (filterEventType) f.push(`typeEvent__EQ__${filterEventType}__AND`)
    if (filterStatus) f.push(`status__EQ__${filterStatus}__AND`)
    return f.length > 0 ? f : undefined
  }, [filterDate, filterClient, filterProvider, filterBillingCode, filterEventType, filterStatus])

  const { notes, pagination, isLoading, error } = useAppointmentNotes({
    filters,
    page,
    pageSize,
  })

  const totalPages = Math.ceil(pagination.total / pageSize)
  const hasActiveFilters = filterDate || filterClient.trim() || filterProvider.trim() || filterBillingCode.trim() || filterEventType || filterStatus

  const clearFilters = useCallback(() => {
    setFilterDate("")
    setFilterClient("")
    setFilterProvider("")
    setFilterBillingCode("")
    setFilterEventType("")
    setFilterStatus("")
    setPage(0)
  }, [])

  const handleOpenNote = (appointmentId: string, billingCode: string) => {
    router.push(`/session-note?appointmentId=${appointmentId}&billingCode=${encodeURIComponent(billingCode)}`)
  }

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <PremiumDatePicker
            label="Date"
            value={filterDate}
            onChange={(v) => { setFilterDate(v); setPage(0) }}
          />
          <FloatingInput
            label="Client"
            value={filterClient}
            onChange={(v) => { setFilterClient(v); setPage(0) }}
            onBlur={() => {}}
          />
          <FloatingInput
            label="Provider"
            value={filterProvider}
            onChange={(v) => { setFilterProvider(v); setPage(0) }}
            onBlur={() => {}}
          />
          <FloatingInput
            label="Billing Code"
            value={filterBillingCode}
            onChange={(v) => { setFilterBillingCode(v); setPage(0) }}
            onBlur={() => {}}
          />
          <FloatingSelect
            label="Event Type"
            value={filterEventType}
            onChange={(v) => { setFilterEventType(v); setPage(0) }}
            options={EVENT_TYPE_OPTIONS}
          />
          <FloatingSelect
            label="Status"
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(0) }}
            options={STATUS_OPTIONS}
          />
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && notes.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <Loader2 className="h-8 w-8 text-[#037ECC] mx-auto animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Loading session notes...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-12 text-center">
          <p className="text-sm font-medium text-red-700">Failed to load session notes</p>
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && notes.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {hasActiveFilters ? "No results found" : "No session notes yet"}
          </h3>
          <p className="text-sm text-slate-500">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : "Session notes will appear here when appointments are completed."}
          </p>
        </div>
      )}

      {/* Table */}
      {notes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_100px_130px_130px_100px_auto] gap-3 px-5 py-3 bg-slate-50/60 border-b border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Client</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Provider</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Billing Code</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Event Type</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</span>
            <span className="w-[100px]" />
          </div>

          {/* Rows */}
          <div className={cn("divide-y divide-slate-100", isLoading && "opacity-50")}>
            {notes.map((note) => (
              <div
                key={note.id}
                className="grid grid-cols-[1fr_1fr_100px_130px_130px_100px_auto] gap-3 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => handleOpenNote(note.appointmentId, note.billingCode)}
              >
                <span className="text-sm font-medium text-slate-800 truncate">{note.clientName}</span>
                <span className="text-sm text-slate-600 truncate">{note.providerName}</span>
                <span className="text-sm text-slate-600 tabular-nums">
                  {note.date ? format(parseLocalDate(note.date), "MM/dd/yyyy") : "—"}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 w-fit">
                  {note.billingCode || "—"}
                </span>
                {/* Event Type — placeholder until backend adds field */}
                <span className="text-xs text-slate-500">—</span>
                {/* Status — placeholder until backend adds field */}
                <span className="text-xs text-slate-500">—</span>
                <div className="flex items-center justify-end gap-1 w-[100px]">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-3 text-xs gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenNote(note.appointmentId, note.billingCode)
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Open
                  </Button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget({ id: note.id, name: note.clientName })
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition-colors",
                page === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-slate-600 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition-colors",
                page >= totalPages - 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          // TODO: connect to delete endpoint when available
          setDeleteTarget(null)
        }}
        title="Delete Session Note"
        message="Are you sure you want to delete this session note? This action cannot be undone."
        itemName={deleteTarget?.name ?? ""}
        isDeleting={false}
      />
    </div>
  )
}
