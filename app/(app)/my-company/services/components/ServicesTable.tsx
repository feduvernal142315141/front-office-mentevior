"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { SearchInput } from "@/components/custom/SearchInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { Button } from "@/components/custom/Button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useServicesTable } from "../hooks/useServicesTable"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { getCompanyServiceById } from "@/lib/modules/services/services/company-services.service"
import type { CompanyService } from "@/lib/types/company-service.types"

export function ServicesTable() {
  const {
    data,
    isLoading,
    isToggling,
    error,
    counts,
    actions,
    filters,
    pagination,
    clearFilters,
  } = useServicesTable()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [serviceDetailsMap, setServiceDetailsMap] = useState<Record<string, CompanyService | null>>({})
  const [loadingDetailIds, setLoadingDetailIds] = useState<Set<string>>(new Set())

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  const startRow = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const endRow = Math.min(pagination.page * pagination.pageSize, pagination.total)

  const isFiltered = useMemo(
    () => Boolean(filters.searchQuery || filters.statusFilter !== "all"),
    [filters.searchQuery, filters.statusFilter]
  )

  const toggleExpanded = (serviceId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(serviceId)) {
        next.delete(serviceId)
        return next
      }

      next.add(serviceId)

      if (!(serviceId in serviceDetailsMap)) {
        setLoadingDetailIds((prevLoading) => new Set(prevLoading).add(serviceId))
        void getCompanyServiceById(serviceId)
          .then((serviceDetails) => {
            setServiceDetailsMap((prevMap) => ({
              ...prevMap,
              [serviceId]: serviceDetails,
            }))
          })
          .finally(() => {
            setLoadingDetailIds((prevLoading) => {
              const nextLoading = new Set(prevLoading)
              nextLoading.delete(serviceId)
              return nextLoading
            })
          })
      }

      return next
    })
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading services</p>
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
              placeholder="Search by service name..."
              onClear={clearFilters}
            />
          </div>

          <FilterSelect
            value={filters.statusFilter}
            onChange={(value) => filters.setStatusFilter(value as "all" | "active" | "inactive")}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="Status"
          />

          {isFiltered && (
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

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="text-base font-semibold text-gray-800">
              {isFiltered ? "No services match your filters" : "No services found"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isFiltered ? "Try adjusting your search criteria" : "No services are available yet"}
            </p>
            {isFiltered && (
              <Button variant="ghost" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden xl:block px-3 pt-3">
              <div className="grid grid-cols-[40px_minmax(260px,1.2fr)_160px_160px_150px_90px] items-center gap-4 px-5 py-3 border border-slate-200 rounded-2xl bg-gradient-to-b from-[#037ECC]/[0.04] to-[#037ECC]/[0.02]">
                <div />
                <div className="text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Service</div>
                <div className="justify-self-center text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Credentials</div>
                <div className="justify-self-center text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Billing Codes</div>
                <div className="justify-self-center text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Status</div>
                <div className="justify-self-center text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Active</div>
              </div>
            </div>

            <div className="space-y-3 p-3">
              {data.map((service) => {
                const isExpanded = expandedIds.has(service.id)
                const isLoadingDetails = loadingDetailIds.has(service.id)
                const details = serviceDetailsMap[service.id]
                const credentials = details?.allowedCredentials ?? service.allowedCredentials
                const billingCodes = details?.allowedBillingCodes ?? service.allowedBillingCodes

                return (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-5 xl:grid xl:grid-cols-[40px_minmax(260px,1.2fr)_160px_160px_150px_90px] xl:gap-4">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(service.id)}
                        className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-150"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-slate-500 transition-transform duration-200",
                            isExpanded ? "rotate-0" : "-rotate-90"
                          )}
                        />
                      </button>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate" title={service.name}>
                          {service.name}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2">{service.description}</p>
                      </div>

                      <div className="xl:justify-self-center">
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">
                          {counts.credentialCount(service)} allowed
                        </Badge>
                      </div>

                      <div className="xl:justify-self-center">
                        <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 whitespace-nowrap">
                          {counts.billingCodeCount(service)} allowed
                        </Badge>
                      </div>

                      <div className="xl:justify-self-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "whitespace-nowrap",
                            service.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                        >
                          {service.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="ml-auto xl:ml-0 xl:justify-self-center" data-row-no-click="true">
                        <Switch
                          checked={service.active}
                          disabled={isToggling}
                          onCheckedChange={(checked) => {
                            void actions.toggleService(service, checked)
                          }}
                          aria-label={`Toggle ${service.name}`}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-5 pb-4 pt-3 space-y-4">
                        {isLoadingDetails ? (
                          <div className="space-y-2">
                            {[1, 2].map((i) => (
                              <div key={i} className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                            ))}
                          </div>
                        ) : (
                          <>
                            <section className="space-y-2">
                              <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-500">Allowed Credentials</h4>
                              {credentials.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">This service starts without predefined credentials.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {credentials.map((credential) => (
                                    <Badge
                                      key={credential.id}
                                      variant="outline"
                                      className="border-blue-200 bg-blue-50 text-blue-700"
                                    >
                                      {credential.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </section>

                            <section className="space-y-2">
                              <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-500">Allowed Billing Codes</h4>
                              {billingCodes.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No billing codes assigned.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {billingCodes.map((billingCode) => (
                                    <Badge
                                      key={billingCode.id}
                                      variant="outline"
                                      className={cn(
                                        billingCode.type === "CPT"
                                          ? "border-purple-200 bg-purple-50 text-purple-700"
                                          : "border-slate-200 bg-slate-50 text-slate-600"
                                      )}
                                    >
                                      {formatBillingCodeDisplay({
                                        type: billingCode.type,
                                        code: billingCode.code,
                                        modifier: billingCode.modifier,
                                      })}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </section>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200/60 bg-gradient-to-b from-slate-50/30 to-white gap-4 flex-wrap">
              <div className="text-xs font-medium text-slate-500">
                Showing {startRow}-{endRow} of {pagination.total}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Rows per page:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(event) => pagination.onPageSizeChange?.(Number(event.target.value))}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    {pagination.pageSizeOptions?.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => pagination.onPageChange(1)}
                    disabled={pagination.page === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    aria-label="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => pagination.onPageChange(totalPages)}
                    disabled={pagination.page === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                    aria-label="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
