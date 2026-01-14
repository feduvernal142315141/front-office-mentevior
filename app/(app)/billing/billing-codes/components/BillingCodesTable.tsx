"use client"

import { useBillingCodesTable } from "../hooks/useBillingCodesTable"
import { useBillingCodeTypes } from "@/lib/modules/billing-codes/hooks/use-billing-code-types"
import { CustomTable } from "@/components/custom/CustomTable"
import { SearchInput } from "@/components/custom/SearchInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"

export function BillingCodesTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    pagination,
    clearFilters,
  } = useBillingCodesTable()
  
  const { types: billingCodeTypes } = useBillingCodeTypes()

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading billing codes</p>
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
              placeholder="Search by code..."
              onClear={clearFilters}
            />
          </div>

          <FilterSelect 
            value={filters.typeFilter}
            onChange={(value) => filters.setTypeFilter(value as any)}
            options={[
              { value: "all", label: "All Types" },
              ...billingCodeTypes.map(type => ({
                value: type.name,
                label: type.name
              }))
            ]}
            placeholder="Type"
          />          

          {(filters.searchQuery || 
            filters.statusFilter !== "all" || 
            filters.typeFilter !== "all") && (
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
        emptyMessage="No billing codes found"
        emptyContent={
          (filters.searchQuery || filters.statusFilter !== "all" || filters.typeFilter !== "all") ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No billing codes match your filters</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(code) => code.id}
        pagination={pagination}
      />
    </div>
  )
}
