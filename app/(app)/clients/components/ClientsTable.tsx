"use client"

import { useClientsTable } from "../hooks/useClientsTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { SearchInput } from "@/components/custom/SearchInput"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"

export function ClientsTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    pagination,
    clearFilters,
  } = useClientsTable()

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading clients</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  const hasFilters = filters.searchQuery

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={filters.inputValue}
              onChange={filters.setSearchQuery}
              placeholder="Search by name."
              onClear={clearFilters}
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="whitespace-nowrap h-[52px] 2xl:h-[56px]">
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      <CustomTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No clients found"
        emptyContent={
          filters.searchQuery || hasFilters ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No clients match your filters</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(client) => client.id}
        pagination={pagination}
      />
    </div>
  )
}
