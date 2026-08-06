"use client"

import { useMemo } from "react"
import { Plus } from "lucide-react"
import { CustomTable } from "@/components/custom/CustomTable"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { getMonthlySupervisionPdfUrl } from "@/lib/modules/monthly-supervision/services/monthly-supervision.service"
import { formatReportMonthLong } from "@/lib/modules/monthly-supervision/utils/report-month"
import { useMonthlySupervisionTable } from "../hooks/useMonthlySupervisionTable"
import { MonthPicker } from "./MonthPicker"

export function MonthlySupervisionTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    clientOptions,
    providerOptions,
    hasActiveFilters,
    clearFilters,
    pagination,
    previewId,
    setPreviewId,
    pendingDelete,
    setPendingDelete,
    confirmDelete,
    isDeleting,
    canCreate,
    goToCreate,
  } = useMonthlySupervisionTable()

  const pdfUrl = useMemo(
    () => (previewId ? getMonthlySupervisionPdfUrl(previewId) : null),
    [previewId],
  )

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-600">Failed to load monthly supervisions</p>
        <p className="mt-1 text-sm text-red-500">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={goToCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Monthly Supervision
          </Button>
        </div>
      )}

      <Card variant="elevated" padding="md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MonthPicker
            label="From"
            value={filters.filterMonthFrom}
            onChange={filters.onMonthFromChange}
            required={false}
            clearable
          />
          <MonthPicker
            label="To"
            value={filters.filterMonthTo}
            onChange={filters.onMonthToChange}
            required={false}
            clearable
          />
          <FloatingSelect
            label="Client"
            value={filters.filterClient}
            onChange={filters.onClientChange}
            options={clientOptions}
            searchable
          />
          <FloatingSelect
            label="Supervisee"
            value={filters.filterProvider}
            onChange={filters.onProviderChange}
            options={providerOptions}
            searchable
          />
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" onClick={clearFilters} className="whitespace-nowrap">
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      <CustomTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage={hasActiveFilters ? "No results found" : "No monthly supervisions yet"}
        emptyContent={
          hasActiveFilters ? (
            <div className="py-8 text-center">
              <p className="text-base font-semibold text-gray-800">
                No monthly supervisions match your filters
              </p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(item) => item.id}
        onRowClick={(item) => setPreviewId(item.id)}
        pagination={pagination}
      />

      {pdfUrl && (
        <DocumentViewer
          open
          onClose={() => setPreviewId(null)}
          documentUrl={pdfUrl}
          fileName="Monthly Supervision.pdf"
        />
      )}

      <DeleteConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Monthly Supervision"
        message="This will remove the report and its supervision entries. This action cannot be undone."
        itemName={
          pendingDelete
            ? `${pendingDelete.clientName} — ${formatReportMonthLong(pendingDelete.requestedReportDate)}`
            : undefined
        }
      />
    </div>
  )
}
