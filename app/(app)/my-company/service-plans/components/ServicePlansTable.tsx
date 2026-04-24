"use client"

import { forwardRef, useImperativeHandle, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CompanyServicePlan } from "@/lib/types/company-service-plan.types"
import { cn } from "@/lib/utils"
import { useServicePlansTable } from "../hooks/useServicePlansTable"

export interface ServicePlansTableRef {
  refetch: () => void
}

interface ServicePlansTableProps {
  onEdit?: (plan: CompanyServicePlan) => void
}

function formatDateLabel(value?: string): string {
  if (!value) return "Not set"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

export const ServicePlansTable = forwardRef<ServicePlansTableRef, ServicePlansTableProps>(
  ({ onEdit }, ref) => {
  const { data, isLoading, error, pagination, refetch } = useServicePlansTable()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useImperativeHandle(ref, () => ({
    refetch: () => {
      void refetch()
    },
  }))

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  const startRow = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const endRow = Math.min(pagination.page * pagination.pageSize, pagination.total)

  const toggleExpanded = (planId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) {
        next.delete(planId)
        return next
      }
      next.add(planId)
      return next
    })
  }

  const emptyState = useMemo(
    () => (
      <div className="py-14 px-6 text-center">
        <p className="text-base font-semibold text-gray-800">No service plans found</p>
        <p className="mt-1 text-sm text-gray-500">Create your first service plan to get started</p>
      </div>
    ),
    []
  )

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-medium">Error loading service plans</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03),0_1px_2px_rgba(15,23,42,0.02)] overflow-hidden">
      {isLoading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : data.length === 0 ? (
        emptyState
      ) : (
        <>
          <div className="hidden xl:block px-3 pt-3">
            <div className="grid grid-cols-[40px_minmax(230px,1.2fr)_minmax(180px,1fr)_minmax(220px,1.2fr)_130px_120px] items-center gap-4 px-5 py-3 border border-slate-200 rounded-2xl bg-gradient-to-b from-[#037ECC]/[0.04] to-[#037ECC]/[0.02]">
              <div />
              <div className="text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Name</div>
              <div className="text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Service</div>
              <div className="text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Dates</div>
              <div className="justify-self-center text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Status</div>
              <div className="justify-self-end text-xs font-semibold text-[#037ECC] uppercase tracking-wider">Actions</div>
            </div>
          </div>

          <div className="space-y-3 p-3">
            {data.map((plan) => {
              const isExpanded = expandedIds.has(plan.id)
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-5 xl:grid xl:grid-cols-[40px_minmax(230px,1.2fr)_minmax(180px,1fr)_minmax(220px,1.2fr)_130px_120px] xl:gap-4">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(plan.id)}
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
                      <p className="text-sm font-semibold text-slate-800 truncate" title={plan.name}>
                        {plan.name}
                      </p>
                      {plan.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{plan.description}</p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 truncate" title={plan.serviceName}>
                        {plan.serviceName || "-"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Start: {formatDateLabel(plan.startDate)}</p>
                      <p className="text-xs text-slate-500 mt-1">End: {formatDateLabel(plan.endDate)}</p>
                    </div>

                    <div className="xl:justify-self-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "whitespace-nowrap",
                          plan.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        )}
                      >
                        {plan.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="ml-auto xl:ml-0 xl:justify-self-end">
                      <button
                        type="button"
                        onClick={() => onEdit?.(plan)}
                        className={cn(
                          "group/edit relative h-9 w-9",
                          "flex items-center justify-center rounded-xl",
                          "bg-gradient-to-b from-blue-50 to-blue-100/80",
                          "border border-blue-200/60 shadow-sm shadow-blue-900/5",
                          "hover:from-blue-100 hover:to-blue-200/90",
                          "hover:border-blue-300/80 hover:shadow-md hover:shadow-blue-900/10",
                          "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
                          "transition-all duration-200 ease-out",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                        )}
                        title="Edit service plan"
                        aria-label="Edit service plan"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600 group-hover/edit:text-blue-700 transition-colors duration-200" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 pb-4 pt-3 space-y-2">
                      <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                        Categories
                      </h4>
                      {plan.categories.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No categories selected.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {plan.categories.map((category) => (
                            <Badge
                              key={`${plan.id}-${category}`}
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
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
  )
  }
)

ServicePlansTable.displayName = "ServicePlansTable"
