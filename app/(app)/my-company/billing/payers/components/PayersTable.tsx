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
  const { data, columns, isLoading, error, filters, clearFilters, refetch, modals } = usePayersTable()

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
                placeholder="Search payers by name..."
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
          getRowKey={(payer) => payer.id}
        />
      </div>
    </>
  )
})

PayersTable.displayName = "PayersTable"
