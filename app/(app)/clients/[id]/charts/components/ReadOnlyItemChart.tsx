"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { LineChart, Loader2, LockKeyhole } from "lucide-react"

import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import type { ChartInterval } from "@/lib/modules/service-plans/constants/chart.constants"
import {
  typeRequiresDailyAndWeekly,
  typeRequiresWeeklyDaily,
  typeRequiresUnitOfTime,
} from "@/lib/modules/service-plans/constants/data-collection.constants"
import { useClientDataCollectionValues } from "@/lib/modules/client-service-plan/hooks/use-client-data-collection-values"
import type {
  ClientServicePlanItemBaseline,
  ClientServicePlanItemObjective,
} from "@/lib/types/client-service-plan.types"

import { useChartData } from "../../configuration/components/datasheets/useChartData"
import { FrequencyChart } from "../../configuration/components/datasheets/FrequencyChart"
import { DurationChart } from "../../configuration/components/datasheets/DurationChart"
import { ActiveObjectiveBanner } from "../../configuration/components/datasheets/ActiveObjectiveBanner"
import { computeHiddenDayKeys } from "../../configuration/components/datasheets/chart-gaps"
import type { WeekEntries } from "../../configuration/components/datasheets/frequency-datasheet.types"

/**
 * Qué renderer sabe dibujar el item sin la pantalla de captura.
 *
 * `Rate` necesita la duración de la sesión (viene de los appointments) y
 * `Percentage` los ensayos uno por uno; ninguno de los dos sale del endpoint de
 * valores recolectados, que devuelve un número por fecha. Antes que dibujar un
 * gráfico con datos que no son los suyos, esas tarjetas mandan a Data Collection.
 */
type ChartKind = "frequency" | "duration" | "unsupported"

export function resolveChartKind(collectionMethodName: string): ChartKind {
  if (typeRequiresDailyAndWeekly(collectionMethodName)) return "duration"
  if (typeRequiresWeeklyDaily(collectionMethodName) && !typeRequiresUnitOfTime(collectionMethodName)) {
    return "frequency"
  }
  return "unsupported"
}

function unitLabelFrom(unitOfTime: string | undefined): string {
  switch (unitOfTime) {
    case "MINUTES":
      return "Minutes"
    case "HOURS":
      return "Hours"
    case "DAYS":
      return "Days"
    default:
      return "Seconds"
  }
}

interface ReadOnlyItemChartProps {
  /** `clientServicePlanCategoryItemId` */
  itemId: string
  itemName: string
  /** Nombre del método de colección resuelto del catálogo (no el UUID) */
  collectionMethodName: string
  unitOfTime?: string
  baselines?: ClientServicePlanItemBaseline[]
  objectives?: ClientServicePlanItemObjective[]
  chartDays: Date[]
  interval: ChartInterval
  tickInterval: number
  onOpen?: () => void
}

/**
 * Una gráfica de item, de sólo lectura. Trae sus propios valores recolectados
 * del rango y los mezcla con los baselines configurados; no edita nada.
 */
export function ReadOnlyItemChart({
  itemId,
  itemName,
  collectionMethodName,
  unitOfTime,
  baselines,
  objectives,
  chartDays,
  interval,
  tickInterval,
  onOpen,
}: ReadOnlyItemChartProps) {
  const kind = resolveChartKind(collectionMethodName)

  const fetchStart = chartDays.length > 0 ? format(chartDays[0], "yyyy-MM-dd") : ""
  const fetchEnd =
    chartDays.length > 0 ? format(chartDays[chartDays.length - 1], "yyyy-MM-dd") : ""

  const dcValues = useClientDataCollectionValues({
    clientServicePlanCategoryItemId: kind === "unsupported" ? "" : itemId,
    startDate: fetchStart,
    endDate: fetchEnd,
  })

  // Baselines configurados + valores recolectados (estos últimos pisan al baseline
  // de la misma fecha). Sin valor en vivo: acá nadie está capturando.
  const entries = useMemo<WeekEntries>(() => {
    const result: WeekEntries = {}

    for (const baseline of baselines ?? []) {
      if (!baseline.show || !baseline.date || baseline.value <= 0) continue
      result[baseline.date.slice(0, 10)] = {
        occurrences: baseline.value,
        initials: "",
        environmentalNote: baseline.environmentalChanges ?? "",
      }
    }

    for (const record of dcValues.records) {
      result[record.date.slice(0, 10)] = {
        occurrences: record.value,
        initials: "",
        environmentalNote: record.environmentalChange ?? "",
      }
    }

    return result
  }, [baselines, dcValues.records])

  const collectedDateKeys = useMemo(
    () => new Set(dcValues.records.map((record) => record.date.slice(0, 10))),
    [dcValues.records],
  )

  const chartData = useChartData({
    clientServicePlanCategoryItemId: kind === "unsupported" ? "" : itemId,
    chartDays,
    interval,
    aggregationMethod: ServicePlanValueType.TOTAL,
    baselines,
    objectives,
    gridEntries: entries,
    collectedDateKeys,
  })

  const hiddenDayKeys = useMemo(
    () =>
      computeHiddenDayKeys({
        chartDays,
        hasData: (key) => (entries[key]?.occurrences ?? 0) > 0,
        baselines,
        objectives,
      }),
    [chartDays, entries, baselines, objectives],
  )

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="group flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/70 disabled:cursor-default disabled:hover:bg-transparent"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{itemName}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {collectionMethodName || "No collection method"}
          </p>
        </div>
        {onOpen && (
          <span className="mt-0.5 shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-colors group-hover:border-[#037ECC]/40 group-hover:text-[#037ECC]">
            Open
          </span>
        )}
      </button>

      <div className="border-t border-slate-100 px-4 py-3">
        {kind === "unsupported" ? (
          <UnsupportedChart collectionMethodName={collectionMethodName} />
        ) : dcValues.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[#037ECC]" />
          </div>
        ) : (
          <div className="space-y-3">
            <ActiveObjectiveBanner objectives={objectives} />
            {kind === "duration" ? (
              <DurationChart
                weekDays={[]}
                entries={entries}
                dcConfig={null}
                chartDays={chartDays}
                gapDateKeys={hiddenDayKeys}
                collectedDateKeys={collectedDateKeys}
                tickInterval={tickInterval}
                aggregatedData={chartData.aggregatedPoints}
                interval={interval}
                itemBaselines={baselines}
                itemObjectives={objectives}
                unitLabel={unitLabelFrom(unitOfTime)}
              />
            ) : (
              <FrequencyChart
                weekDays={[]}
                entries={entries}
                dcConfig={null}
                chartDays={chartDays}
                gapDateKeys={hiddenDayKeys}
                collectedDateKeys={collectedDateKeys}
                tickInterval={tickInterval}
                aggregatedData={chartData.aggregatedPoints}
                interval={interval}
                itemBaselines={baselines}
                itemObjectives={objectives}
                compact
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function UnsupportedChart({ collectionMethodName }: { collectionMethodName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
        <LockKeyhole className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-slate-600">
        {collectionMethodName || "This method"} charts open in Data Collection
      </p>
      <p className="max-w-[240px] text-xs text-slate-400">
        Its chart needs session data that only the data collection screen has.
      </p>
    </div>
  )
}

/** Card vacía, para categorías sin items configurados */
export function EmptyChartsCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-10">
      <LineChart className="h-6 w-6 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
