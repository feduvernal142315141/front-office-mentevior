"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { LayoutGrid, LineChart, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { toast } from "@/lib/compat/sonner"
import {
  getClientServicePlanByClientId,
  getClientServicePlanCategories,
  getClientServicePlanCategoryItems,
} from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import { useClientDataCollectionValuesByCategory } from "@/lib/modules/client-service-plan/hooks/use-client-data-collection-values-by-category"
import { useTypeEventCatalog } from "@/lib/modules/service-plans/hooks/use-type-event-catalog"
import type {
  ClientServicePlanCategoryMappedItem,
  ClientServicePlanCategorySummary,
} from "@/lib/types/client-service-plan.types"
import type { ChartInterval } from "@/lib/modules/service-plans/constants/chart.constants"

import { ChartDateRangeToolbar } from "../../configuration/components/datasheets/ChartDateRangeToolbar"
import { useChartDateRange } from "../../configuration/components/datasheets/useChartDateRange"
import { EmptyChartsCard, ReadOnlyItemChart } from "./ReadOnlyItemChart"

interface CategoryWithItems {
  category: ClientServicePlanCategorySummary
  items: ClientServicePlanCategoryMappedItem[]
}

/**
 * Todas las gráficas del cliente organizadas por tabs de categoría.
 *
 * Solo se carga (GET …/by-category-id) la categoría seleccionada; las demás
 * no disparan requests hasta que el usuario las activa.
 */
interface ClientChartsViewProps {
  clientId: string
  clientServicePlanId?: string | null
  onServicePlanResolved?: (servicePlanId: string) => void
}

export function ClientChartsView({
  clientId,
  clientServicePlanId,
  onServicePlanResolved,
}: ClientChartsViewProps) {
  const router = useRouter()
  const [groups, setGroups] = useState<CategoryWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasServicePlan, setHasServicePlan] = useState(true)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const onServicePlanResolvedRef = useRef(onServicePlanResolved)
  onServicePlanResolvedRef.current = onServicePlanResolved

  const { itemsMap: typeEventMap, isLoading: isLoadingCatalog } = useTypeEventCatalog()
  const chartRange = useChartDateRange("1M")

  useEffect(() => {
    let active = true

    void (async () => {
      setIsLoading(true)
      try {
        const servicePlan = await getClientServicePlanByClientId(clientId)
        if (!servicePlan) {
          if (active) {
            setGroups([])
            setHasServicePlan(false)
          }
          return
        }

        const categories = await getClientServicePlanCategories(servicePlan.id)
        const loaded = await Promise.all(
          categories.map(async (category) => ({
            category,
            items: await getClientServicePlanCategoryItems(category.id).catch(() => []),
          })),
        )

        if (active) {
          setGroups(loaded)
          setHasServicePlan(true)
          if (loaded.length > 0) setActiveCategoryId(loaded[0].category.id)
          onServicePlanResolvedRef.current?.(servicePlan.id)
        }
      } catch {
        if (active) {
          setGroups([])
          toast.error("Unable to load charts", {
            description: "Failed to load the client's service plan.",
          })
        }
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [clientId])

  const openServicePlan = useCallback(() => {
    const query = new URLSearchParams({ section: "service-plan" })
    if (clientServicePlanId) query.set("spId", clientServicePlanId)
    router.push(`/clients/${clientId}/configuration?${query.toString()}`)
  }, [clientId, clientServicePlanId, router])

  const totalItems = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
  )

  const activeGroup = useMemo(
    () => groups.find((g) => g.category.id === activeCategoryId) ?? null,
    [groups, activeCategoryId],
  )

  const fetchStart =
    chartRange.chartDays.length > 0 ? format(chartRange.chartDays[0], "yyyy-MM-dd") : ""
  const fetchEnd =
    chartRange.chartDays.length > 0
      ? format(chartRange.chartDays[chartRange.chartDays.length - 1], "yyyy-MM-dd")
      : ""

  if (isLoading || isLoadingCatalog) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#037ECC]" />
      </div>
    )
  }

  if (!hasServicePlan) {
    return (
      <EmptyChartsCard message="This client has no active service plan yet." />
    )
  }

  if (totalItems === 0) {
    return <EmptyChartsCard message="No items configured in the client's service plan." />
  }

  return (
    <div className="space-y-6">
      {/* Sticky control bar: toolbar + category tabs */}
      <div className="sticky top-0 z-10 -mx-1 space-y-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <ChartDateRangeToolbar
          preset={chartRange.preset}
          rangeLabel={chartRange.rangeLabel}
          isAtToday={chartRange.isAtToday}
          interval={chartRange.interval}
          presetsDisabled={chartRange.presetsDisabled}
          onPresetChange={chartRange.setPreset}
          onIntervalChange={chartRange.setInterval}
          onPrev={chartRange.goToPrev}
          onNext={chartRange.goToNext}
          onToday={chartRange.goToToday}
        />

        {/* Category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {groups.map(({ category, items }) => {
            const isActive = category.id === activeCategoryId
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] text-white shadow-md shadow-[#037ECC]/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#037ECC]/30 hover:text-[#037ECC] hover:shadow-sm",
                )}
              >
                <span className="truncate max-w-[180px]">{category.categoryName}</span>
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums transition-colors",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-[#037ECC]/10 group-hover:text-[#037ECC]",
                  )}
                >
                  {items.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active category content */}
      {activeGroup && (
        <CategoryChartsSection
          key={activeGroup.category.id}
          category={activeGroup.category}
          items={activeGroup.items}
          typeEventMap={typeEventMap}
          chartDays={chartRange.chartDays}
          interval={chartRange.interval}
          tickInterval={chartRange.tickInterval}
          fetchStart={fetchStart}
          fetchEnd={fetchEnd}
          onOpen={openServicePlan}
        />
      )}
    </div>
  )
}

interface CategoryChartsSectionProps {
  category: ClientServicePlanCategorySummary
  items: ClientServicePlanCategoryMappedItem[]
  typeEventMap: Map<string, { name: string }>
  chartDays: Date[]
  interval: ChartInterval
  tickInterval: number
  fetchStart: string
  fetchEnd: string
  onOpen: () => void
}

/**
 * Una categoría = un GET de valores. Las tarjetas reciben el slice de su item
 * y no vuelven a pegarle al endpoint por item.
 */
function CategoryChartsSection({
  category,
  items,
  typeEventMap,
  chartDays,
  interval,
  tickInterval,
  fetchStart,
  fetchEnd,
  onOpen,
}: CategoryChartsSectionProps) {
  const { recordsByItemId, isLoading } = useClientDataCollectionValuesByCategory(
    category.id,
    fetchStart,
    fetchEnd,
  )

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10">
          <LineChart className="h-4 w-4 text-[#037ECC]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-800">
            {category.categoryName}
          </h2>
          <p className="text-xs text-slate-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyChartsCard message={`No items in ${category.categoryName}.`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => {
            const typeId = item.dataCollection?.typeEventCatalogId || category.typeEventCatalogId
            const methodName =
              typeEventMap.get(typeId ?? "")?.name ?? category.typeEventCatalogName ?? ""

            return (
              <ReadOnlyItemChart
                key={item.id}
                itemId={item.id}
                itemName={item.itemName}
                collectionMethodName={methodName}
                unitOfTime={item.dataCollection?.unitOfTime}
                baselines={item.baseline}
                objectives={item.objetive}
                chartDays={chartDays}
                interval={interval}
                tickInterval={tickInterval}
                environmentalChanges={item.environmentalChanges}
                preloadedRecords={recordsByItemId.get(item.id) ?? []}
                preloadedLoading={isLoading}
                onOpen={onOpen}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
