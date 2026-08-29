"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Edit2, Eye, FileCheck } from "lucide-react"
import { SearchInput } from "@/components/custom/SearchInput"
import { Card } from "@/components/custom/Card"
import { useDebouncedState } from "@/lib/hooks/use-debounced-state"
import { useBatchClaims } from "@/lib/modules/batch-claims/hooks/use-batch-claims"
import { getBatchDecision, getEffectiveBadge } from "@/lib/modules/batch-claims/claim-md-status"
import { cn } from "@/lib/utils"
import { ClaimMdStatusBadge } from "./ClaimMdStatusBadge"

const GRID_COLS = "grid-cols-[minmax(180px,1.4fr)_minmax(160px,1.2fr)_minmax(160px,1.2fr)_minmax(120px,1fr)_88px]"
const GRID_COLS_WITH_CLAIM_MD =
  "grid-cols-[minmax(170px,1.3fr)_minmax(150px,1.1fr)_minmax(150px,1.1fr)_minmax(120px,1fr)_130px_88px]"

interface BatchClaimsTableProps {
  canEdit: boolean
}

export function BatchClaimsTable({ canEdit }: BatchClaimsTableProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { batchClaims, totalCount, isLoading, error } = useBatchClaims(
    searchQuery as string,
    page - 1,
    pageSize,
  )

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    setSearchQuery(value)
    setPage(1)
  }

  const clearFilters = () => {
    setInputValue("")
    setSearchQuery("")
    setPage(1)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    try {
      return format(new Date(dateStr), "MMM dd, yyyy")
    } catch {
      return dateStr
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // El listado sólo muestra la columna de Claim.MD si el backend manda el campo.
  const showClaimMd = batchClaims.some((batch) => batch.claimMdEffectiveStatus != null)
  const gridCols = showClaimMd ? GRID_COLS_WITH_CLAIM_MD : GRID_COLS

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-600">Error loading batch claims</p>
        <p className="mt-1 text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card variant="elevated" padding="md">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchInput
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Search by reference..."
              onClear={clearFilters}
            />
          </div>
        </div>
      </Card>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && batchClaims.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="relative mb-1">
              <div className="absolute inset-0 rounded-full bg-[#037ECC]/10 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
                <FileCheck className="h-10 w-10 text-[#037ECC]/60" />
              </div>
            </div>
            {searchQuery ? (
              <>
                <p className="text-base font-semibold text-gray-800">No batch claims match your search</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or clear the field</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">No batch claims yet</p>
                <p className="max-w-md text-center text-sm text-slate-500">
                  Create a batch to group billable appointments by payer plan and generate CMS-1500 / 837P claims.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rows */}
      {!isLoading && batchClaims.length > 0 && (
        <div className="space-y-3">
          {/* Column headers */}
          <div className={cn("hidden xl:grid items-center gap-3 px-5 pb-1", gridCols)}>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">Reference</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">Payer</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">Plan</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">Created</span>
            {showClaimMd && (
              <span className="text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">Claim.MD</span>
            )}
            <span className="text-center text-xs font-semibold uppercase tracking-wider text-[#037ECC]/60">Actions</span>
          </div>

          {batchClaims.map((batch) => (
            <div
              key={batch.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={cn("grid items-center gap-3 px-5 py-4", gridCols)}>
                <div className="min-w-0">
                  <span className="block truncate font-semibold text-slate-900">{batch.reference || "—"}</span>
                  {batch.comments && (
                    <span className="block truncate text-xs text-slate-400">{batch.comments}</span>
                  )}
                </div>
                <span className="truncate text-sm font-medium text-slate-700">{batch.payerName || "—"}</span>
                <span className="truncate text-sm text-slate-600">{batch.payerPlanName || "—"}</span>
                <span className="text-sm text-slate-500">{formatDate(batch.createAt)}</span>
                {/*
                  La celda se renderiza siempre: `ClaimMdStatusBadge` devuelve `null` sin
                  estado, y una celda de menos corre el resto de la fila una columna.
                */}
                {showClaimMd && (
                  <span className="min-w-0">
                    {batch.claimMdEffectiveStatus ? (
                      <ClaimMdStatusBadge badge={getEffectiveBadge(batch.claimMdEffectiveStatus)} />
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </span>
                )}
                <div className="flex w-[88px] items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/my-company/billing/billed-claims/${batch.id}`)}
                    className={cn(
                      "group/view flex h-8 w-8 items-center justify-center rounded-xl",
                      "border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/80 shadow-sm",
                      "hover:-translate-y-0.5 hover:border-slate-300 active:translate-y-0",
                      "transition-all duration-200 ease-out",
                      "focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-2",
                    )}
                    title="View batch claim"
                    aria-label="View batch claim"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-600 transition-colors group-hover/view:text-slate-800" />
                  </button>
                  {canEdit && !getBatchDecision(batch.claimMdEffectiveStatus).isLocked && (
                    <button
                      type="button"
                      onClick={() => router.push(`/my-company/billing/billed-claims/${batch.id}/edit`)}
                      className={cn(
                        "group/edit flex h-8 w-8 items-center justify-center rounded-xl",
                        "border border-blue-200/60 bg-gradient-to-b from-blue-50 to-blue-100/80 shadow-sm",
                        "hover:-translate-y-0.5 hover:border-blue-300/80 hover:from-blue-100 hover:to-blue-200/90 active:translate-y-0",
                        "transition-all duration-200 ease-out",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2",
                      )}
                      title="Edit batch claim"
                      aria-label="Edit batch claim"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-blue-600 transition-colors group-hover/edit:text-blue-700" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && batchClaims.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {batchClaims.length} of {totalCount} batch claim{totalCount !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-[#037ECC] focus:outline-none focus:ring-1 focus:ring-[#037ECC]/30"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  page <= 1
                    ? "cursor-not-allowed border-slate-100 text-slate-300"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                )}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs tabular-nums text-slate-600">{page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  page >= totalPages
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
  )
}
