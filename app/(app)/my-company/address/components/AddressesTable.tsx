"use client"

import { useAddressesTable } from "../hooks/useAddressesTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { SearchInput } from "@/components/custom/SearchInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"

export function AddressesTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    pagination,
    clearFilters,
    deleteModal,
  } = useAddressesTable()

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading addresses</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={filters.inputValue}
              onChange={filters.setSearchQuery}
              placeholder="Search by nickname..."
              onClear={clearFilters}
            />
          </div>

          <FilterSelect 
            value={filters.statusFilter}
            onChange={(value) => filters.setStatusFilter(value as any)}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="Status"
          />

          {(filters.searchQuery || filters.statusFilter !== "all") && (
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
        emptyMessage="No addresses found"
        emptyContent={
          (filters.searchQuery || filters.statusFilter !== "all") ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No addresses match your filters</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(address) => address.id}
        pagination={pagination}
      />

      {deleteModal}
    </div>
  )
}
