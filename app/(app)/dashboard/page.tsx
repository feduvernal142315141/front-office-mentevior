"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Gauge, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useDashboardSummary } from "@/lib/modules/dashboard/hooks/use-dashboard-summary"
import { IS_DASHBOARD_MOCKED } from "@/lib/modules/dashboard/services/dashboard.source"
import { Button } from "@/components/custom/Button"
import { ActionCenter } from "./components/ActionCenter"
import { AuthorizationUtilization } from "./components/AuthorizationUtilization"
import { DashboardErrorState } from "./components/DashboardErrorState"
import { DocumentCompliance } from "./components/DocumentCompliance"
import { ExpiringList } from "./components/ExpiringList"
import { KpiRow } from "./components/KpiRow"
import { LastUpdated } from "./components/LastUpdated"
import { ScopeToggle } from "./components/ScopeToggle"
import { TrendChart } from "./components/TrendChart"
import { type AttentionFilter, ALL_FILTER, matchesFilter } from "./components/attention-filter"
import { useDashboardLayout } from "./hooks/useDashboardLayout"
import { useDashboardScope } from "./hooks/useDashboardScope"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuth()
  const layout = useDashboardLayout()
  const { scope, setScope, canSwitch } = useDashboardScope()
  const { summary, isLoading, isRefreshing, error, refetch } = useDashboardSummary(scope)

  const [filter, setFilter] = useState<AttentionFilter>(ALL_FILTER)
  const listRef = useRef<HTMLDivElement>(null)

  /** Lo que el rol puede ver: es la base de la que cuentan TANTO el hero como la lista */
  const scopedItems = useMemo(
    () => (summary?.expiring?.items ?? []).filter((item) => layout.allowedExpiringKinds.includes(item.kind)),
    [summary?.expiring?.items, layout.allowedExpiringKinds],
  )

  /**
   * El backend manda el top 20 con el total real aparte. Esa diferencia es la
   * cola que no llegó y el hero tiene que contarla.
   *
   * Sólo aplica si el filtro por rol no quitó nada: si quitó, el total del
   * backend describe un conjunto distinto del que se está mostrando y sumarlo
   * inventaría vencimientos que este usuario no puede ver.
   */
  const truncatedCount = useMemo(() => {
    const received = summary?.expiring?.items?.length ?? 0
    const backendTotal = summary?.expiring?.total
    if (backendTotal === undefined || received !== scopedItems.length) return 0
    return Math.max(0, backendTotal - received)
  }, [summary?.expiring?.items?.length, summary?.expiring?.total, scopedItems.length])

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

  const handleScopeChange = useCallback(
    (next: NonNullable<typeof scope>) => {
      // El filtro es sobre el conjunto anterior: mantenerlo activo dejaría al
      // usuario mirando un grupo que quizá ya no existe en el alcance nuevo.
      setFilter(ALL_FILTER)
      setScope(next)
    },
    [setScope],
  )

  const isBusy = isLoading || isRefreshing

  return (
    <div className="p-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <Gauge className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Dashboard
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-slate-600">What needs your attention today</p>
              <LastUpdated generatedAt={summary?.generatedAt} isRefreshing={isRefreshing} />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {IS_DASHBOARD_MOCKED && (
              <span
                className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 sm:inline-flex"
                title="Remove NEXT_PUBLIC_DASHBOARD_MOCK=true to use the real endpoint"
              >
                Mock data
              </span>
            )}

            {canSwitch && (
              <ScopeToggle
                scope={scope ?? "company"}
                onChange={handleScopeChange}
                disabled={isBusy || scope === null}
              />
            )}

            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isBusy}
              className="flex items-center gap-2"
            >
              <RefreshCw className={isBusy ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <DashboardErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <div
            // Al refrescar, la vista se atenúa en lugar de vaciarse: el usuario
            // no pierde de vista lo que estaba leyendo.
            className={cn(
              "space-y-5 transition-opacity duration-200",
              isRefreshing && "pointer-events-none opacity-60",
            )}
            aria-busy={isBusy}
          >
            <ActionCenter
              summary={summary?.actionCenter}
              items={scopedItems}
              hasExpiringSection={!!summary?.expiring}
              truncatedCount={truncatedCount}
              filter={filter}
              onFilterChange={handleFilterChange}
              isLoading={isLoading}
              userName={user?.name}
            />

            <KpiRow
              kpis={summary?.kpis}
              isLoading={isLoading}
              compact={layout.compactKpis}
              hrefs={layout.kpiHrefs}
            />

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
                truncatedCount={truncatedCount}
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
