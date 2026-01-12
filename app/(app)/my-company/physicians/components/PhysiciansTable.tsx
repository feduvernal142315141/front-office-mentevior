"use client"

import { usePhysiciansTable } from "../hooks/usePhysiciansTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { SearchInput } from "@/components/custom/SearchInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"

export function PhysiciansTable() {
  const {
    physicians,
    columns,
    isLoading,
    error,
    totalRecords,
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    searchQuery,
    statusFilter,
    setStatusFilter,
    onSearchChange,
    onClearFilters,
  } = usePhysiciansTable()

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading physicians</p>
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
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search by name, specialty, or address..."
              onClear={onClearFilters}
            />
          </div>

          <FilterSelect 
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as any)}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="Status"
          />

          {(searchQuery || statusFilter !== "all") && (
            <Button 
              variant="ghost"
              onClick={onClearFilters}
              className="whitespace-nowrap h-[52px] 2xl:h-[56px]"
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      <CustomTable
        columns={columns}
        data={physicians}
        isLoading={isLoading}
        emptyMessage="No physicians found"
        emptyContent={
          (searchQuery || statusFilter !== "all") ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No physicians match your filters</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={onClearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(physician) => physician.id}
        pagination={{
          page: currentPage,
          pageSize,
          total: totalRecords,
          onPageChange,
          onPageSizeChange,
        }}
      />
    </div>
  )
}
