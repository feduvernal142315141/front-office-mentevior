"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { LineChart, Loader2 } from "lucide-react"

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
 * Todas las gráficas del cliente en una pantalla, agrupadas por categoría
 * (Maladaptive Behaviors, Replacement Behaviors, Caregiver Training…).
 *
 * Un solo control de rango arriba gobierna todas las gráficas: con un toolbar
 * por tarjeta la pantalla se vuelve ilegible. Es sólo lectura — para capturar o
 * configurar se entra al item desde la tarjeta.
 *
 * Valores recolectados: 1× `GET …/by-category-id/{categoryId}` por categoría
 * (no N× GET por item).
 */
interface ClientChartsViewProps {
  clientId: string
  /** El del `spId` de la URL, si se entró desde Configuration. */
  clientServicePlanId?: string | null
  /** Avisa el service plan que se resolvió, para que los links de vuelta lo lleven. */
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

  // Por ref: el aviso no debe hacer que la carga se vuelva a disparar si quien
  // nos usa pasa la función en línea.
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
        // Una llamada por categoría: cada una ya devuelve sus items con baselines,
        // objetivos y configuración, así que no hace falta pedir nivel por item.
        const loaded = await Promise.all(
          categories.map(async (category) => ({
            category,
            items: await getClientServicePlanCategoryItems(category.id).catch(() => []),
          })),
        )

        if (active) {
          setGroups(loaded)
          setHasServicePlan(true)
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

  // La pantalla de configuración todavía no acepta el item por URL (sólo `spId`,
  // `section`, `appointmentId` y `appointmentDate`), así que la tarjeta lleva al
  // Service Plan del cliente y desde ahí se entra al item. El `spId` va sí o sí:
  // sin él la configuración abre en "No service plan assigned".
  const openServicePlan = useCallback(() => {
    const query = new URLSearchParams({ section: "service-plan" })
    if (clientServicePlanId) query.set("spId", clientServicePlanId)
    router.push(`/clients/${clientId}/configuration?${query.toString()}`)
  }, [clientId, clientServicePlanId, router])

  const totalItems = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
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
    <div className="space-y-8">
      <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
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
      </div>

      {groups.map(({ category, items }) => (
        <CategoryChartsSection
          key={category.id}
          category={category}
          items={items}
          typeEventMap={typeEventMap}
          chartDays={chartRange.chartDays}
          interval={chartRange.interval}
          tickInterval={chartRange.tickInterval}
          fetchStart={fetchStart}
          fetchEnd={fetchEnd}
          onOpen={openServicePlan}
        />
      ))}
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
      <div className="mb-3 flex items-center gap-2">
        <LineChart className="h-4 w-4 text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {category.categoryName}
        </h2>
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-bold tabular-nums text-slate-500">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyChartsCard message={`No items in ${category.categoryName}.`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => {
            // El item puede pisar el método de la categoría con el suyo
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
