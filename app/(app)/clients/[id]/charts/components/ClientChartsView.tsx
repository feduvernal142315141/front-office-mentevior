"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LineChart, Loader2 } from "lucide-react"

import { toast } from "@/lib/compat/sonner"
import {
  getClientServicePlanByClientId,
  getClientServicePlanCategories,
  getClientServicePlanCategoryItems,
} from "@/lib/modules/client-service-plan/services/client-service-plan.service"
import { useTypeEventCatalog } from "@/lib/modules/service-plans/hooks/use-type-event-catalog"
import type {
  ClientServicePlanCategoryMappedItem,
  ClientServicePlanCategorySummary,
} from "@/lib/types/client-service-plan.types"

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
 */
export function ClientChartsView({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [groups, setGroups] = useState<CategoryWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasServicePlan, setHasServicePlan] = useState(true)

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
  // Service Plan del cliente y desde ahí se entra al item.
  const openServicePlan = useCallback(() => {
    router.push(`/clients/${clientId}/configuration?section=service-plan`)
  }, [clientId, router])

  const totalItems = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
  )

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
        <section key={category.id}>
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
                    chartDays={chartRange.chartDays}
                    interval={chartRange.interval}
                    tickInterval={chartRange.tickInterval}
                    onOpen={openServicePlan}
                  />
                )
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
