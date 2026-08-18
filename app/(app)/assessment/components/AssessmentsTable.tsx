"use client"

import { useMemo } from "react"
import { ClipboardCheck, Plus } from "lucide-react"
import { useAssessmentsTable } from "../hooks/useAssessmentsTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { getAssessmentPdfUrl } from "@/lib/modules/assessments/services/assessments.service"

export function AssessmentsTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    clientOptions,
    hasActiveFilters,
    clearFilters,
    previewId,
    setPreviewId,
    pagination,
    canCreate,
    goToCreate,
  } = useAssessmentsTable()

  const pdfUrl = useMemo(() => (previewId ? getAssessmentPdfUrl(previewId) : null), [previewId])

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Failed to load assessments</p>
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
            New Assessment
          </Button>
        </div>
      )}

      <Card variant="elevated" padding="md">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        emptyMessage={hasActiveFilters ? "No results found" : "No assessments yet"}
        hideEmptyIcon
        emptyContent={
          hasActiveFilters ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No assessments match your filters</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="relative mb-1">
                <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                  <ClipboardCheck className="h-10 w-10 text-[#037ECC]/60" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-700">No assessments available</p>
              <p className="max-w-md text-center text-sm text-slate-500">
                Create the first assessment to capture the client&apos;s school, family and clinical background.
              </p>
            </div>
          )
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
          fileName="Behavior Analysis Assessment and Support Plan.pdf"
        />
      )}
    </div>
  )
}
