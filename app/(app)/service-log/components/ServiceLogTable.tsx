"use client"

import { useMemo } from "react"
import { Button } from "@/components/custom/Button"
import { Card } from "@/components/custom/Card"
import { CustomTable } from "@/components/custom/CustomTable"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { getServiceLogPdfUrl } from "@/lib/modules/service-log/services/service-log.service"
import { useServiceLogTable } from "../hooks/useServiceLogTable"

interface ServiceLogTableProps {
  /** Incrementarlo fuerza un refetch (la generación es asíncrona) */
  reloadKey?: number
}

export function ServiceLogTable({ reloadKey = 0 }: ServiceLogTableProps) {
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
    goToDetail,
  } = useServiceLogTable(reloadKey)

  const pdfUrl = useMemo(
    () => (previewId ? getServiceLogPdfUrl(previewId) : null),
    [previewId],
  )

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-600">Failed to load service logs</p>
        <p className="mt-1 text-sm text-red-500">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PremiumDatePicker
            label="From"
            value={filters.filterFrom}
            onChange={filters.onFromChange}
          />
          <PremiumDatePicker
            label="To"
            value={filters.filterTo}
            onChange={filters.onToChange}
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
        emptyMessage={hasActiveFilters ? "No results found" : "No service logs generated yet"}
        emptyContent={
          hasActiveFilters ? (
            <div className="py-8 text-center">
              <p className="text-base font-semibold text-gray-800">
                No service logs match your filters
              </p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-base font-semibold text-gray-800">No service logs generated yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Generate them for a date range above. Generation runs in the background — new logs
                may take a moment to appear.
              </p>
            </div>
          )
        }
        getRowKey={(item) => item.id}
        // La fila abre el detalle, no el PDF: el log no se edita, así que ver
        // qué contiene es la acción principal.
        onRowClick={goToDetail}
        pagination={pagination}
      />

      {pdfUrl && (
        <DocumentViewer
          open
          onClose={() => setPreviewId(null)}
          documentUrl={pdfUrl}
          fileName="Service Log.pdf"
        />
      )}
    </div>
  )
}
