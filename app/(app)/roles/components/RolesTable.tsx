"use client"

import { useRolesTable } from "../hooks/useRolesTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { Button } from "@/components/custom/Button"
import { SearchInput } from "@/components/custom/SearchInput"
import { Card } from "@/components/custom/Card"

export function RolesTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    pagination,
    totalCount,
    filteredCount,
    clearFilters,
  } = useRolesTable()

  if (error) {
    return (
      <Card variant="elevated" padding="lg" className="bg-red-50 border-red-200">
        <p className="text-red-600 font-medium">Error loading roles</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card variant="elevated" padding="md">
        <SearchInput
          value={filters.inputValue}
          onChange={filters.setSearchQuery}
          placeholder="Search by role name..."
          onClear={clearFilters}
        />
      </Card>

      {/* Table Card */}
      <Card variant="elevated" padding="none">
        <CustomTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          emptyMessage="No roles found"
          emptyContent={
            filters.inputValue ? (
              <div>
                <p className="text-gray-500">No roles match your search</p>
                <Button variant="ghost" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              </div>
            ) : undefined
          }
          pagination={pagination}
          getRowKey={(role) => role.id}
        />
      </Card>
    </div>
  )
}
