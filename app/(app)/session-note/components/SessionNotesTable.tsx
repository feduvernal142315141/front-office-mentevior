"use client"

import { useState, useCallback, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSessionNotesTable } from "../hooks/useSessionNotesTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { getAppointmentNotePdfPreviewUrl } from "@/lib/modules/appointment-notes/services/appointment-note.service"

export function SessionNotesTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    hasActiveFilters,
    pagination,
    clientOptions,
    providerOptions,
    clearFilters,
    previewAppointmentId,
    setPreviewAppointmentId,
    handleOpenNote,
  } = useSessionNotesTable()

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handlePreviewPdf = useCallback(async (appointmentId: string) => {
    if (isGeneratingPdf) return
    setIsGeneratingPdf(true)
    try {
      setPdfUrl(getAppointmentNotePdfPreviewUrl(appointmentId))
    } catch {
      toast.error("Failed to generate PDF preview")
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [isGeneratingPdf])

  useEffect(() => {
    if (previewAppointmentId) {
      handlePreviewPdf(previewAppointmentId)
    }
  }, [previewAppointmentId])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Failed to load session notes</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <PremiumDatePicker
            label="Date"
            value={filters.filterDate}
            onChange={filters.onDateChange}
          />
          <FloatingSelect
            label="Client"
            value={filters.filterClient}
            onChange={filters.onClientChange}
            options={clientOptions}
            searchable
          />
          <FloatingSelect
            label="Provider"
            value={filters.filterProvider}
            onChange={filters.onProviderChange}
            options={providerOptions}
            searchable
          />
          <FloatingInput
            label="Billing Code"
            value={filters.filterBillingCode}
            onChange={filters.onBillingCodeChange}
            onBlur={() => {}}
          />
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      <CustomTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage={hasActiveFilters ? "No results found" : "No session notes yet"}
        emptyContent={
          hasActiveFilters ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No session notes match your filters</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(note) => note.id}
        onRowClick={(note) => handleOpenNote(note.appointmentId, note.billingCode)}
        pagination={pagination}
      />

      {pdfUrl && (
        <DocumentViewer
          open
          onClose={() => {
            setPdfUrl(null)
            setPreviewAppointmentId(null)
          }}
          documentUrl={pdfUrl}
          fileName="Session Note.pdf"
        />
      )}
    </div>
  )
}
