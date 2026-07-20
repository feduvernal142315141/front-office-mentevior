"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { useAppointmentNotes } from "@/lib/modules/appointment-notes/hooks/use-appointment-notes"
import { cn } from "@/lib/utils"
import { parseLocalDate } from "@/app/(app)/clients/[id]/configuration/components/datasheets/datasheet-utils"

export function SessionNotesTable() {
  const router = useRouter()
  const [page, setPage] = useState(0)
  const pageSize = 10

  const { notes, pagination, isLoading, error } = useAppointmentNotes({
    page,
    pageSize,
  })

  const totalPages = Math.ceil(pagination.total / pageSize)

  const handleOpenNote = (appointmentId: string, billingCode: string) => {
    router.push(`/session-note?appointmentId=${appointmentId}&billingCode=${encodeURIComponent(billingCode)}`)
  }

  if (isLoading && notes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center">
        <Loader2 className="h-8 w-8 text-[#037ECC] mx-auto animate-spin" />
        <p className="mt-3 text-sm text-slate-500">Loading session notes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white shadow-sm p-12 text-center">
        <p className="text-sm font-medium text-red-700">Failed to load session notes</p>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-700 mb-1">No session notes yet</h3>
        <p className="text-sm text-slate-500">Session notes will appear here when appointments are completed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_120px_160px_auto] gap-4 px-5 py-3 bg-slate-50/60 border-b border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Client</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Provider</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Billing Code</span>
          <span className="w-[80px]" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {notes.map((note) => (
            <div
              key={note.id}
              className="grid grid-cols-[1fr_1fr_120px_160px_auto] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => handleOpenNote(note.appointmentId, note.billingCode)}
            >
              <span className="text-sm font-medium text-slate-800">{note.clientName}</span>
              <span className="text-sm text-slate-600">{note.providerName}</span>
              <span className="text-sm text-slate-600 tabular-nums">
                {note.date ? format(parseLocalDate(note.date), "MM/dd/yyyy") : "—"}
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 w-fit">
                {note.billingCode ? `CPT ${note.billingCode}` : "—"}
              </span>
              <div className="flex justify-end w-[80px]">
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
              </div>
            </div>
          ))}
        </div>
      </div>

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
                page === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50"
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
                page >= totalPages - 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
