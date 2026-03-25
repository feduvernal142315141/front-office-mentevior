"use client"

import { forwardRef, useImperativeHandle } from "react"
import { CustomTable } from "@/components/custom/CustomTable"
import { SearchInput } from "@/components/custom/SearchInput"
import { Card } from "@/components/custom/Card"
import { usePayersTable } from "../hooks/usePayersTable"

export interface PayersTableRef {
  refetch: () => void
}

export const PayersTable = forwardRef<PayersTableRef>((_, ref) => {
  const { data, columns, isLoading, error, filters, pagination, clearFilters, refetch, modals } =
    usePayersTable()

  useImperativeHandle(ref, () => ({ refetch }))

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading payers</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <>
      {modals}
      <div className="space-y-4">
        <Card variant="elevated" padding="md">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchInput
                value={filters.inputValue}
                onChange={filters.setSearchQuery}
                placeholder="Search by name..."
                onClear={clearFilters}
              />
            </div>
          </div>
        </Card>

        <CustomTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          emptyMessage="No payers found"
          emptyContent={
            filters.searchQuery ? (
              <div className="text-center py-8">
                <p className="text-base font-semibold text-gray-800">No payers match your search</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or clear the field</p>
              </div>
            ) : undefined
          }
          getRowKey={(payer) => payer.id}
          pagination={pagination}
        />
      </div>
    </>
  )
})

PayersTable.displayName = "PayersTable"
