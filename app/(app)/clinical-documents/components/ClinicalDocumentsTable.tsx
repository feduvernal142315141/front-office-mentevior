"use client"

import { forwardRef, useImperativeHandle } from "react"
import { useClinicalDocumentsTable } from "../hooks/useClinicalDocumentsTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { SearchInput } from "@/components/custom/SearchInput"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"

export interface ClinicalDocumentsTableRef {
  refetch: () => void
}

export const ClinicalDocumentsTable = forwardRef<ClinicalDocumentsTableRef>((props, ref) => {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    pagination,
    clearFilters,
    refetch,
    deleteModal,
  } = useClinicalDocumentsTable()

  useImperativeHandle(ref, () => ({
    refetch,
  }))

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading clinical documents</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <>
      {deleteModal}
      <div className="space-y-4">
      <Card variant="elevated" padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={filters.inputValue}
              onChange={filters.setSearchQuery}
              placeholder="Search by document name..."
              onClear={clearFilters}
            />
          </div>

          {filters.searchQuery && (
            <Button 
              variant="ghost"
              onClick={clearFilters}
              className="whitespace-nowrap h-[52px] 2xl:h-[56px]"
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      <CustomTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No clinical documents found"
        emptyContent={
          filters.searchQuery ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No documents match your filters</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(document) => document.id}
        pagination={pagination}
      />
    </div>
    </>
  )
})

ClinicalDocumentsTable.displayName = "ClinicalDocumentsTable"
