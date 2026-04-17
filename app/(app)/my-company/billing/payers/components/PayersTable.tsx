"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ChevronDown, ChevronLeft, ChevronRight, Edit2, ShieldCheck, Trash2 } from "lucide-react"
import { SearchInput } from "@/components/custom/SearchInput"
import { Card } from "@/components/custom/Card"
import { DeleteConfirmModal } from "@/components/custom/DeleteConfirmModal"
import { getPayersService } from "@/lib/modules/payers/services/payers.service"
import type { Payer, PayerRateEmbed } from "@/lib/types/payer.types"
import { cn } from "@/lib/utils"
import { parseLocalDate } from "@/lib/date"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { usePayersTable } from "../hooks/usePayersTable"

export interface PayersTableRef {
  refetch: () => void
}

function PayerInitials({ payer }: { payer: Payer }) {
  const [imageError, setImageError] = useState(false)
  const showImage = Boolean(payer.logoUrl) && !imageError
  const initials = (payer.name || "PI")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm shadow-slate-900/5">
      {showImage ? (
        <img
          src={payer.logoUrl ?? ""}
          alt={`${payer.name} logo`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#037ECC]/15 via-[#079CFB]/10 to-[#037ECC]/20 text-xs font-semibold tracking-wide text-[#037ECC]">
          {initials}
        </div>
      )}
    </div>
  )
}

const GRID_COLS = "grid-cols-[32px_minmax(120px,1.5fr)_100px_minmax(100px,1fr)_minmax(100px,1fr)_100px_72px]"

export const PayersTable = forwardRef<PayersTableRef>((_, ref) => {
  const router = useRouter()
  const {
    data: payers,
    isLoading,
    error,
    totalCount,
    filters,
    pagination,
    clearFilters,
    refetch,
    canEditPayers,
    canDeletePayers,
    deleteState,
  } = usePayersTable()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [ratesMap, setRatesMap] = useState<Record<string, PayerRateEmbed[]>>({})
  const [loadingRateIds, setLoadingRateIds] = useState<Set<string>>(new Set())

  useImperativeHandle(ref, () => ({ refetch }))

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        if (!(id in ratesMap)) {
          setLoadingRateIds((s) => new Set(s).add(id))
          void getPayersService()
            .getById(id)
            .then((payer) => {
              setRatesMap((m) => ({ ...m, [id]: payer.payerRates ?? [] }))
            })
            .finally(() => {
              setLoadingRateIds((s) => {
                const n = new Set(s)
                n.delete(id)
                return n
              })
            })
        }
      }
      return next
    })
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    try {
      return format(parseLocalDate(dateStr), "MMM dd, yyyy")
    } catch {
      return dateStr
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pagination.pageSize))
  const hasActions = canEditPayers || canDeletePayers

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-600">Error loading payers</p>
        <p className="mt-1 text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <>
      {/* Delete confirm modal */}
      <DeleteConfirmModal
        isOpen={deleteState.isOpen}
        onClose={deleteState.close}
        onConfirm={deleteState.confirm}
        title="Delete Payer"
        message="Are you sure you want to delete this payer? This action cannot be undone."
        itemName={deleteState.payer?.name}
        isDeleting={deleteState.isDeleting}
      />

      <div className="space-y-4">
        {/* Search */}
        <Card variant="elevated" padding="md">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <SearchInput
                value={filters.inputValue}
                onChange={filters.setSearchQuery}
                placeholder="Search by name..."
                onClear={clearFilters}
              />
            </div>
          </div>
        </Card>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && payers.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="relative mb-1">
                <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                  <ShieldCheck className="h-10 w-10 text-[#037ECC]/60" />
                </div>
              </div>
              {filters.searchQuery ? (
                <>
                  <p className="text-base font-semibold text-gray-800">No payers match your search</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or clear the field
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">No payers yet</p>
                  <p className="max-w-md text-center text-sm text-slate-500">
                    Add a payer to start managing insurance plans and rates for your organization.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Payer cards */}
        {!isLoading && payers.length > 0 && (
          <div className="space-y-3">
            {/* Column headers */}
            <div
              className={cn(
                "hidden xl:grid items-center gap-3 px-5 pb-1",
                GRID_COLS,
              )}
            >
              <div />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">
                Name
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">
                External ID
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">
                Clearing House
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">
                Plan Type
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">
                Created
              </span>
              {hasActions && (
                <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60 text-center">
                  Actions
                </span>
              )}
            </div>

            {/* Card rows */}
            {payers.map((payer) => {
              const isExpanded = expandedIds.has(payer.id)
              const rates: PayerRateEmbed[] = ratesMap[payer.id] ?? []

              return (
                <div
                  key={payer.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Card header row */}
                  <div
                    className={cn(
                      "grid items-center gap-3 px-5 py-4",
                      GRID_COLS,
                    )}
                  >
                    {/* Expand toggle */}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(payer.id)}
                      className={cn(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
                        "bg-slate-100 transition-colors duration-150 hover:bg-slate-200",
                      )}
                      aria-label={isExpanded ? "Collapse rates" : "Expand rates"}
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-slate-500 transition-transform duration-200",
                          isExpanded ? "rotate-0" : "-rotate-90",
                        )}
                      />
                    </button>

                    {/* Name + Logo */}
                    <div className="flex items-center gap-3 min-w-0">
                      <PayerInitials payer={payer} />
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">
                          {payer.name}
                        </span>
                      </div>
                    </div>

                    {/* External ID */}
                    <span className="truncate text-sm text-slate-600">
                      {payer.externalId || "—"}
                    </span>

                    {/* Clearing House */}
                    <span className="truncate text-sm text-slate-600">
                      {payer.clearingHouseName || "—"}
                    </span>

                    {/* Plan Type */}
                    <span className="truncate text-sm text-slate-600">
                      {payer.planTypeName || "—"}
                    </span>

                    {/* Created */}
                    <span className="text-sm text-slate-500">
                      {formatDate(payer.createdAt)}
                    </span>

                    {/* Actions */}
                    {hasActions && (
                      <div className="flex w-[72px] items-center justify-end gap-2">
                        {canEditPayers && (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/my-company/billing/payers/${payer.id}/edit`)
                            }
                            className={cn(
                              "group/edit h-8 w-8",
                              "flex items-center justify-center rounded-xl",
                              "bg-gradient-to-b from-blue-50 to-blue-100/80",
                              "border border-blue-200/60 shadow-sm",
                              "hover:from-blue-100 hover:to-blue-200/90 hover:border-blue-300/80",
                              "hover:-translate-y-0.5 active:translate-y-0",
                              "transition-all duration-200 ease-out",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2",
                            )}
                            title="Edit payer"
                            aria-label="Edit payer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-blue-600 transition-colors group-hover/edit:text-blue-700" />
                          </button>
                        )}

                        {canDeletePayers && (
                          <button
                            type="button"
                            onClick={() => deleteState.open(payer)}
                            className={cn(
                              "group/del h-8 w-8",
                              "flex items-center justify-center rounded-xl",
                              "bg-gradient-to-b from-red-50 to-red-100/80",
                              "border border-red-200/60 shadow-sm",
                              "hover:from-red-100 hover:to-red-200/90 hover:border-red-300/80",
                              "hover:-translate-y-0.5 active:translate-y-0",
                              "transition-all duration-200 ease-out",
                              "focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2",
                            )}
                            title="Delete payer"
                            aria-label="Delete payer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500 transition-colors group-hover/del:text-red-700" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 pb-4 pt-3">
                      {loadingRateIds.has(payer.id) ? (
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-200" />
                          ))}
                        </div>
                      ) : rates.length === 0 ? (
                        <p className="py-3 text-center text-sm italic text-slate-400">
                          No rates configured.
                        </p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          {/* Sub-header */}
                          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-100/80 px-4 py-2">
                            {["Billing Code", "Amount", "Currency", "Interval"].map((h, i) => (
                              <span
                                key={h}
                                className={cn(
                                  "text-[10px] font-semibold uppercase tracking-widest text-slate-400",
                                  i > 0 && "text-center"
                                )}
                              >
                                {h}
                              </span>
                            ))}
                          </div>

                          {/* Rate rows */}
                          {rates.map((rate, idx) => {
                            const billingCodeDisplay = formatBillingCodeDisplay({
                              type: rate.billingCodeType || rate.billingCodeTypeName || rate.billingCodeTypeCode || "",
                              code: rate.billingCode ?? rate.billingCodeId,
                              modifier: rate.billingModifier,
                            })

                            return (
                            <div
                              key={rate.id ?? idx}
                              className={cn(
                                "grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 px-4 py-3",
                                idx > 0 && "border-t border-slate-100",
                              )}
                            >
                              <span className="text-sm font-medium text-[#037ECC]">
                                {billingCodeDisplay}
                              </span>
                              <span className="text-sm tabular-nums text-slate-700 text-center">
                                {rate.amount}
                              </span>
                              <span className="text-sm text-slate-500 text-center">
                                {rate.currencyCode || "—"}
                              </span>
                              <span className="text-sm text-slate-500 text-center">
                                {rate.intervalType || "—"}
                              </span>
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && payers.length > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing {payers.length} of {totalCount} payer{totalCount !== 1 ? "s" : ""}
            </span>

            <div className="flex items-center gap-3">
              {/* Page size selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Rows:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-[#037ECC] focus:outline-none focus:ring-1 focus:ring-[#037ECC]/30"
                >
                  {pagination.pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                    pagination.page <= 1
                      ? "cursor-not-allowed border-slate-100 text-slate-300"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                  )}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-2 text-xs tabular-nums text-slate-600">
                  {pagination.page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= totalPages}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                    pagination.page >= totalPages
                      ? "cursor-not-allowed border-slate-100 text-slate-300"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                  )}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
})

PayersTable.displayName = "PayersTable"
