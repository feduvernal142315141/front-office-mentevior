"use client"

import { useRolesTable } from "../hooks/useRolesTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/custom/Button"
import { Search } from "lucide-react"
import { Card } from "@/components/custom/Card"

export function RolesTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by role name..."
                value={filters.inputValue}
                onChange={(e) => filters.setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredCount}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> roles
            </p>

            {filters.inputValue && (
              <Button variant="ghost" onClick={clearFilters} className="text-sm">
                Clear filters
              </Button>
            )}
          </div>
        </div>
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
          getRowKey={(role) => role.id}
        />
      </Card>
    </div>
  )
}
