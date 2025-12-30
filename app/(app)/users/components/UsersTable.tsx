"use client"

import { useUsersTable } from "../hooks/useUsersTable"
import { CustomTable } from "@/components/custom/CustomTable"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function UsersTable() {
  const {
    data,
    columns,
    isLoading,
    error,
    filters,
    uniqueRoles,
    totalCount,
    filteredCount,
    clearFilters,
  } = useUsersTable()

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading users</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={filters.searchQuery}
                onChange={(e) => filters.setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.statusFilter}
              onValueChange={filters.setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.roleFilter} onValueChange={filters.setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredCount}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> users
            </p>

            {(filters.searchQuery || 
              filters.statusFilter !== "all" || 
              filters.roleFilter !== "all") && (
              <Button variant="link" onClick={clearFilters} className="text-sm">
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <CustomTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No users found"
        emptyContent={
          filters.searchQuery ? (
            <div>
              <p className="text-gray-500">No users match your search</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(user) => user.id}
      />
    </div>
  )
}
