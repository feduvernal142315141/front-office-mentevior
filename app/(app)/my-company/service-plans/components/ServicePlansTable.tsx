"use client"

import { forwardRef, useImperativeHandle, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2, Sliders, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import type { CompanyServicePlan } from "@/lib/types/company-service-plan.types"
import { cn } from "@/lib/utils"
import { useServicePlansTable } from "../hooks/useServicePlansTable"
import { useServicePlanCategoriesCatalog } from "@/lib/modules/service-plans/hooks/use-service-plan-categories-catalog"
import {
  deleteCompanyServicePlan,
  getCompanyServicePlanById,
} from "@/lib/modules/service-plans/services/company-service-plans.service"
import { parseLocalDate } from "@/lib/date"
import { toast } from "@/lib/compat/sonner"

export interface ServicePlansTableRef {
  refetch: () => void
}

interface ServicePlansTableProps {
  onEdit?: (plan: CompanyServicePlan) => void
}

function formatDateLabel(value?: string): string {
  if (!value) return "—"
  try {
    return format(parseLocalDate(value), "MMM dd, yyyy")
  } catch {
    return value
  }
}

export const ServicePlansTable = forwardRef<ServicePlansTableRef, ServicePlansTableProps>(
  ({ onEdit }, ref) => {
  const router = useRouter()
  const { data, isLoading, error, pagination, refetch } = useServicePlansTable()
  const { options: categoryOptions, refreshCatalog } = useServicePlanCategoriesCatalog()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [categoriesByPlanId, setCategoriesByPlanId] = useState<Record<string, string[]>>({})
  const [loadingDetailIds, setLoadingDetailIds] = useState<Set<string>>(new Set())
  const [planToDelete, setPlanToDelete] = useState<CompanyServicePlan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const categoryLabelById = useMemo(() => {
    return new Map(categoryOptions.map((option) => [option.value, option.label]))
  }, [categoryOptions])

  useImperativeHandle(ref, () => ({
    refetch: () => {
      void (async () => {
        await refetch()

        if (expandedIds.size === 0) return

        const expandedPlanIds = Array.from(expandedIds)

        setCategoriesByPlanId((prev) => {
          const next = { ...prev }
          expandedPlanIds.forEach((planId) => {
            delete next[planId]
          })
          return next
        })

        await Promise.all(expandedPlanIds.map((planId) => loadPlanCategories(planId, true)))
      })()
    },
  }))

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  const startRow = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const endRow = Math.min(pagination.page * pagination.pageSize, pagination.total)

  const loadPlanCategories = async (planId: string, force = false) => {
    if (!force && (categoriesByPlanId[planId] || loadingDetailIds.has(planId))) return

    setLoadingDetailIds((prev) => {
      const next = new Set(prev)
      next.add(planId)
      return next
    })

    try {
      const detail = await getCompanyServicePlanById(planId)
      if (!detail) return

      const hasUnmappedCategory = detail.categories.some((category) => !categoryLabelById.has(category))
      if (hasUnmappedCategory) {
        await refreshCatalog(true)
      }

      setCategoriesByPlanId((prev) => ({
        ...prev,
        [planId]: detail.categories,
      }))
    } finally {
      setLoadingDetailIds((prev) => {
        const next = new Set(prev)
        next.delete(planId)
        return next
      })
    }
  }

  const toggleExpanded = (planId: string) => {
    const shouldExpand = !expandedIds.has(planId)

    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) {
        next.delete(planId)
        return next
      }
      next.add(planId)
      return next
    })

    if (shouldExpand) {
      void loadPlanCategories(planId)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return

    try {
      setIsDeleting(true)
      await deleteCompanyServicePlan(planToDelete.id)
      toast.success("Service plan deleted successfully")
      setPlanToDelete(null)
      await refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete service plan"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
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
            <div className="grid grid-cols-[40px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)_104px_152px] items-center gap-3 px-4 py-3 border border-slate-200 rounded-2xl bg-gradient-to-b from-[#037ECC]/[0.04] to-[#037ECC]/[0.02]">
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
              const expandedCategories = categoriesByPlanId[plan.id] ?? plan.categories
              const sortedExpandedCategories = [...expandedCategories].sort((a, b) => {
                const labelA = categoryLabelById.get(a) ?? a
                const labelB = categoryLabelById.get(b) ?? b
                return labelA.localeCompare(labelB, undefined, { sensitivity: "base" })
              })
              const isLoadingCategories = loadingDetailIds.has(plan.id)
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="px-4 py-4 sm:px-5">
                    <div className="xl:hidden space-y-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(plan.id)}
                          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors duration-150"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-slate-500 transition-transform duration-200",
                              isExpanded ? "rotate-0" : "-rotate-90"
                            )}
                          />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate" title={plan.name}>
                            {plan.name}
                          </p>
                          {plan.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{plan.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/my-company/service-plans/${plan.id}/configuration`)}
                            className="
                              group/manage
                              relative
                              h-9 w-9
                              flex items-center justify-center
                              rounded-xl
                              bg-gradient-to-b from-slate-50 to-slate-100/80
                              border border-slate-200/70
                              shadow-sm
                              shadow-slate-900/5
                              hover:from-slate-100
                              hover:to-slate-200/90
                              hover:border-slate-300/80
                              hover:shadow-md
                              hover:shadow-slate-900/10
                              hover:-translate-y-0.5
                              active:translate-y-0
                              active:shadow-sm
                              transition-all
                              duration-200
                              ease-out
                              focus:outline-none
                              focus:ring-2
                              focus:ring-[#037ECC]/20
                              focus:ring-offset-2
                            "
                            title="Configuration"
                            aria-label="Configuration"
                          >
                            <Sliders className="w-4 h-4 text-slate-600 group-hover/manage:text-[#037ECC] transition-colors duration-200" />
                          </button>

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

                          <button
                            type="button"
                            onClick={() => setPlanToDelete(plan)}
                            className={cn(
                              "group/del h-9 w-9",
                              "flex items-center justify-center rounded-xl",
                              "bg-gradient-to-b from-red-50 to-red-100/80",
                              "border border-red-200/60 shadow-sm",
                              "hover:from-red-100 hover:to-red-200/90 hover:border-red-300/80",
                              "hover:-translate-y-0.5 active:translate-y-0",
                              "transition-all duration-200 ease-out",
                              "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
                            )}
                            title="Delete service plan"
                            aria-label="Delete service plan"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500 transition-colors group-hover/del:text-red-700" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Service</p>
                          <p className="mt-1 text-sm text-slate-700 truncate" title={plan.serviceName}>
                            {plan.serviceName || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
                          <div className="mt-1">
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
                        </div>

                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 sm:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dates</p>
                          <p className="mt-1 text-xs text-slate-600">Start: {formatDateLabel(plan.startDate)}</p>
                          <p className="text-xs text-slate-600 mt-1">End: {formatDateLabel(plan.endDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="hidden xl:grid xl:grid-cols-[40px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)_104px_152px] xl:items-center xl:gap-3">
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

                      <div className="xl:justify-self-end flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/my-company/service-plans/${plan.id}/configuration`)}
                          className="
                            group/manage
                            relative
                            h-9 w-9
                            flex items-center justify-center
                            rounded-xl
                            bg-gradient-to-b from-slate-50 to-slate-100/80
                            border border-slate-200/70
                            shadow-sm
                            shadow-slate-900/5
                            hover:from-slate-100
                            hover:to-slate-200/90
                            hover:border-slate-300/80
                            hover:shadow-md
                            hover:shadow-slate-900/10
                            hover:-translate-y-0.5
                            active:translate-y-0
                            active:shadow-sm
                            transition-all
                            duration-200
                            ease-out
                            focus:outline-none
                            focus:ring-2
                            focus:ring-[#037ECC]/20
                            focus:ring-offset-2
                          "
                          title="Configuration"
                          aria-label="Configuration"
                        >
                          <Sliders className="w-4 h-4 text-slate-600 group-hover/manage:text-[#037ECC] transition-colors duration-200" />
                        </button>

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

                        <button
                          type="button"
                          onClick={() => setPlanToDelete(plan)}
                          className={cn(
                            "group/del h-9 w-9",
                            "flex items-center justify-center rounded-xl",
                            "bg-gradient-to-b from-red-50 to-red-100/80",
                            "border border-red-200/60 shadow-sm",
                            "hover:from-red-100 hover:to-red-200/90 hover:border-red-300/80",
                            "hover:-translate-y-0.5 active:translate-y-0",
                            "transition-all duration-200 ease-out",
                            "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2"
                          )}
                          title="Delete service plan"
                          aria-label="Delete service plan"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500 transition-colors group-hover/del:text-red-700" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 pb-4 pt-3 space-y-2">
                      <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                        Categories
                      </h4>
                      {isLoadingCategories ? (
                        <p className="text-sm text-slate-400 italic">Loading categories...</p>
                      ) : expandedCategories.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No categories selected.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {sortedExpandedCategories.map((category) => (
                            <Badge
                              key={`${plan.id}-${category}`}
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              {categoryLabelById.get(category) ?? category}
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

          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-200/60 bg-gradient-to-b from-slate-50/30 to-white gap-4 flex-wrap">
            <div className="text-xs font-medium text-slate-500">
              Showing {startRow}-{endRow} of {pagination.total}
            </div>

            <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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

              <div className="flex items-center gap-2 self-end sm:self-auto">
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

      <DeleteConfirmModal
        isOpen={Boolean(planToDelete)}
        onClose={() => {
          if (isDeleting) return
          setPlanToDelete(null)
        }}
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
        title="Delete Service Plan"
        message="Are you sure you want to delete this service plan? This action cannot be undone."
        itemName={planToDelete?.name}
        isDeleting={isDeleting}
      />
    </div>
  )
  }
)

ServicePlansTable.displayName = "ServicePlansTable"
