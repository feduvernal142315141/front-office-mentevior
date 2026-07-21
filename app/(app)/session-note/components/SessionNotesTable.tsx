"use client"

import { useSessionNotesTable } from "../hooks/useSessionNotesTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"

export function SessionNotesTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    hasActiveFilters,
    pagination,
    clearFilters,
    deleteTarget,
    setDeleteTarget,
    handleOpenNote,
  } = useSessionNotesTable()

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
          <FloatingInput
            label="Client"
            value={filters.filterClient}
            onChange={filters.onClientChange}
            onBlur={() => {}}
          />
          <FloatingInput
            label="Provider"
            value={filters.filterProvider}
            onChange={filters.onProviderChange}
            onBlur={() => {}}
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
