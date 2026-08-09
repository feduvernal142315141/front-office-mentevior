"use client"

import { useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { Card } from "@/components/custom/Card"
import { CustomTable } from "@/components/custom/CustomTable"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { MonthRangePicker } from "@/components/custom/MonthRangePicker"
import { getCaseSupervisionLogPdfUrl } from "@/lib/modules/case-supervision-log/services/case-supervision-log.service"
import { useCaseSupervisionLogTable } from "../hooks/useCaseSupervisionLogTable"

export function CaseSupervisionLogTable() {
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
    canCreate,
    goToCreate,
    goToDetail,
  } = useCaseSupervisionLogTable()

  const pdfUrl = useMemo(
    () => (previewId ? getCaseSupervisionLogPdfUrl(previewId) : null),
    [previewId],
  )

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-600">Failed to load case supervision logs</p>
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
            New Case Supervision Log
          </Button>
        </div>
      )}

      <Card variant="elevated" padding="md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MonthRangePicker
            label="Period"
            startValue={filters.filterMonthFrom}
            endValue={filters.filterMonthTo}
            onChange={filters.onMonthRangeChange}
          />
          <FloatingSelect
            label="Client"
            value={filters.filterClient}
            onChange={filters.onClientChange}
            options={clientOptions}
            searchable
          />
          <FloatingSelect
            label="Supervisor"
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
        emptyMessage={hasActiveFilters ? "No results found" : "No case supervision logs yet"}
        emptyContent={
          hasActiveFilters ? (
            <div className="py-8 text-center">
              <p className="text-base font-semibold text-gray-800">
                No case supervision logs match your filters
              </p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(item) => item.id}
        // La fila abre el detalle, no el PDF: el reporte no se puede editar, así
        // que ver qué contiene es la acción principal.
        onRowClick={goToDetail}
        pagination={pagination}
      />

      {pdfUrl && (
        <DocumentViewer
          open
          onClose={() => setPreviewId(null)}
          documentUrl={pdfUrl}
          fileName="Case Supervision Log.pdf"
        />
      )}
    </div>
  )
}
