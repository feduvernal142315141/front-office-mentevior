"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { AlertTriangle, Gauge, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useDashboardSummary } from "@/lib/modules/dashboard/hooks/use-dashboard-summary"
import { IS_DASHBOARD_MOCKED } from "@/lib/modules/dashboard/services/dashboard.source"
import { Button } from "@/components/custom/Button"
import { ActionCenter } from "./components/ActionCenter"
import { AuthorizationUtilization } from "./components/AuthorizationUtilization"
import { DocumentCompliance } from "./components/DocumentCompliance"
import { ExpiringList } from "./components/ExpiringList"
import { KpiRow } from "./components/KpiRow"
import { TrendChart } from "./components/TrendChart"
import { type AttentionFilter, ALL_FILTER, matchesFilter } from "./components/attention-filter"
import { useDashboardLayout } from "./hooks/useDashboardLayout"

export default function DashboardPage() {
  const { user } = useAuth()
  const layout = useDashboardLayout()
  const { summary, isLoading, error, refetch } = useDashboardSummary()

  const [filter, setFilter] = useState<AttentionFilter>(ALL_FILTER)
  const listRef = useRef<HTMLDivElement>(null)

  /** Lo que el rol puede ver: es la base de la que cuentan TANTO el hero como la lista */
  const scopedItems = useMemo(
    () => (summary?.expiring?.items ?? []).filter((item) => layout.allowedExpiringKinds.includes(item.kind)),
    [summary?.expiring?.items, layout.allowedExpiringKinds],
  )

  const filteredItems = useMemo(
    () => scopedItems.filter((item) => matchesFilter(item, filter)),
    [scopedItems, filter],
  )

  const handleFilterChange = useCallback((next: AttentionFilter) => {
    setFilter(next)
    // En pantallas chicas el chip queda arriba y la lista fuera de vista: sin
    // esto el click parece no hacer nada.
    if (next.type !== "all") {
      requestAnimationFrame(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      })
    }
  }, [])

  return (
    <div className="p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <Gauge className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Dashboard
            </h1>
            <p className="mt-1 text-slate-600">What needs your attention today</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {IS_DASHBOARD_MOCKED && (
              <span
                className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 sm:inline-flex"
                title="Set NEXT_PUBLIC_DASHBOARD_MOCK=false to use the real endpoint"
              >
                Mock data
              </span>
            )}
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-[#d03b3b]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-red-700">We couldn&apos;t load your dashboard</p>
            <p className="mt-1 text-xs text-red-500">{error.message}</p>
            <Button variant="secondary" onClick={() => refetch()} className="mt-4">
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <ActionCenter
              summary={summary?.actionCenter}
              items={scopedItems}
              filter={filter}
              onFilterChange={handleFilterChange}
              isLoading={isLoading}
              userName={user?.name}
            />

            <KpiRow kpis={summary?.kpis} isLoading={isLoading} compact={layout.compactKpis} />

            <div
              ref={listRef}
              className={
                layout.showAuthorizationUtilization
                  ? "grid scroll-mt-6 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
                  : "grid scroll-mt-6 grid-cols-1 gap-5"
              }
            >
              <ExpiringList
                items={filteredItems}
                hasData={!!summary?.expiring}
                isLoading={isLoading}
                filter={filter}
                onClearFilter={() => setFilter(ALL_FILTER)}
              />
              {layout.showAuthorizationUtilization && (
                <AuthorizationUtilization
                  data={summary?.authorizationUtilization}
                  isLoading={isLoading}
                />
              )}
            </div>

            <div
              className={
                layout.showDocumentCompliance
                  ? "grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
                  : "grid grid-cols-1 gap-5"
              }
            >
              {layout.showTrend && <TrendChart data={summary?.trend} isLoading={isLoading} />}
              {layout.showDocumentCompliance && (
                <DocumentCompliance data={summary?.documentCompliance} isLoading={isLoading} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
