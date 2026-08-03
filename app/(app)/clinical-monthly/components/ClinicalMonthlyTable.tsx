"use client"

import { useMemo } from "react"
import { Plus } from "lucide-react"
import { useClinicalMonthlyTable, STATUS_FILTER_ENABLED } from "../hooks/useClinicalMonthlyTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { getClinicalMonthlyPdfUrl } from "@/lib/modules/clinical-monthly/services/clinical-monthly.service"

export function ClinicalMonthlyTable() {
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
    statusOptions,
    clearFilters,
    previewId,
    setPreviewId,
    canCreate,
    goToCreate,
  } = useClinicalMonthlyTable()

  const pdfUrl = useMemo(
    () => (previewId ? getClinicalMonthlyPdfUrl(previewId) : null),
    [previewId],
  )

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Failed to load clinical monthlies</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={goToCreate} className="gap-2 flex items-center">
            <Plus className="w-4 h-4" />
            New Clinical Monthly
          </Button>
        </div>
      )}

      <Card variant="elevated" padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <PremiumDatePicker
            label="From"
            value={filters.filterDateFrom}
            onChange={filters.onDateFromChange}
            onClear={() => filters.onDateFromChange("")}
          />
          <PremiumDatePicker
            label="To"
            value={filters.filterDateTo}
            onChange={filters.onDateToChange}
            onClear={() => filters.onDateToChange("")}
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
          <div title={STATUS_FILTER_ENABLED ? undefined : "Pending backend support"}>
            <FloatingSelect
              label="Status"
              value={filters.filterStatus}
              onChange={filters.onStatusChange}
              options={statusOptions}
              disabled={!STATUS_FILTER_ENABLED}
            />
          </div>
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
        emptyMessage={hasActiveFilters ? "No results found" : "No clinical monthlies yet"}
        emptyContent={
          hasActiveFilters ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No clinical monthlies match your filters</p>
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
          fileName="Clinical Monthly.pdf"
        />
      )}
    </div>
  )
}
