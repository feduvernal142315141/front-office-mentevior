"use client"

import { CustomTable } from "@/components/custom/CustomTable"
import { SearchInput } from "@/components/custom/SearchInput"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { CustomModal } from "@/components/custom/CustomModal"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import type { ProvidersOnFileTableState } from "../hooks/useProvidersOnFileTable"

interface ProvidersOnFileTableProps {
  table: ProvidersOnFileTableState
}

export function ProvidersOnFileTable({ table }: ProvidersOnFileTableProps) {
  const {
    providers,
    columns,
    isLoading,
    error,
    totalRecords,
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    searchQuery,
    onSearchChange,
    onClearFilters,
    isFormModalOpen,
    editingProvider,
    form,
    formErrors,
    updateFormField,
    closeFormModal,
    handleSave,
    isSaving,
    specialtyOptions,
    isLoadingSpecialties,
    deleteModal,
  } = table

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading providers</p>
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
              placeholder="Search by name"
              onClear={onClearFilters}
            />
          </div>

          {searchQuery && (
            <Button variant="ghost" onClick={onClearFilters} className="whitespace-nowrap h-[52px] 2xl:h-[56px]">
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      <CustomTable
        columns={columns}
        data={providers}
        isLoading={isLoading}
        emptyMessage="No providers found"
        emptyContent={
          searchQuery ? (
            <div className="text-center py-8">
              <p className="text-base font-semibold text-gray-800">No providers match your search</p>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
              <Button variant="ghost" onClick={onClearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : undefined
        }
        getRowKey={(provider) => provider.id}
        pagination={{
          page: currentPage,
          pageSize,
          total: totalRecords,
          onPageChange,
          onPageSizeChange,
        }}
      />

      <CustomModal
        open={isFormModalOpen}
        onOpenChange={(open) => {
          if (!open) closeFormModal()
        }}
        title={editingProvider ? "Edit provider on file" : "New provider on file"}
        description={
          editingProvider
            ? "Update the provider's information"
            : "Register another provider involved with your clients"
        }
        maxWidthClassName="sm:max-w-[640px]"
      >
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FloatingInput
                label="First name"
                value={form.firstName}
                onChange={(v) => updateFormField("firstName", v)}
                onBlur={() => {}}
                hasError={!!formErrors.firstName}
                required
              />
              {formErrors.firstName && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{formErrors.firstName}</p>
              )}
            </div>
            <div>
              <FloatingInput
                label="Last name"
                value={form.lastName}
                onChange={(v) => updateFormField("lastName", v)}
                onBlur={() => {}}
                hasError={!!formErrors.lastName}
                required
              />
              {formErrors.lastName && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{formErrors.lastName}</p>
              )}
            </div>
            <div>
              <FloatingInput
                label="Agency name"
                value={form.agencyName}
                onChange={(v) => updateFormField("agencyName", v)}
                onBlur={() => {}}
                hasError={!!formErrors.agencyName}
                required
              />
              {formErrors.agencyName && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{formErrors.agencyName}</p>
              )}
            </div>
            <div>
              <FloatingSelect
                label="Specialty"
                value={form.specialyId}
                onChange={(v) => updateFormField("specialyId", v)}
                options={specialtyOptions}
                disabled={isLoadingSpecialties}
                hasError={!!formErrors.specialyId}
                searchable
                required
              />
              {formErrors.specialyId && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{formErrors.specialyId}</p>
              )}
            </div>
            <div>
              <FloatingInput
                label="Phone"
                value={form.phone}
                onChange={(v) => updateFormField("phone", v)}
                onBlur={() => {}}
                inputMode="tel"
                hasError={!!formErrors.phone}
                required
              />
              {formErrors.phone && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{formErrors.phone}</p>
              )}
            </div>
            <FloatingInput
              label="Email"
              value={form.email}
              onChange={(v) => updateFormField("email", v)}
              onBlur={() => {}}
              inputMode="email"
            />
          </div>
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <Button type="button" variant="secondary" onClick={closeFormModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} loading={isSaving} disabled={isSaving}>
              {editingProvider ? "Update provider" : "Create provider"}
            </Button>
          </div>
        </div>
      </CustomModal>

      {deleteModal}
    </div>
  )
}
