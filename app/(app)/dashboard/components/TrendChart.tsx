"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity } from "lucide-react"
import type { TrendPoint } from "@/lib/types/dashboard.types"
import { SectionCard } from "@/components/custom/SectionCard"
import { BRAND, STATUS_COLOR } from "./tokens"
import { WidgetPendingBackend, WidgetSkeleton } from "./WidgetStates"

interface TrendChartProps {
  data?: { points: TrendPoint[] }
  isLoading?: boolean
}

interface FacetProps {
  title: string
  points: TrendPoint[]
  dataKey: "sessions" | "notesPending"
  color: string
  valueLabel: string
}

function TrendTooltip({ active, payload, label, valueLabel }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
        {payload[0].value} <span className="font-normal text-slate-500">{valueLabel}</span>
      </p>
    </div>
  )
}

/**
 * Una faceta = una serie con su propia escala.
 *
 * Sesiones y notas pendientes tienen magnitudes distintas: meterlas en la misma
 * gráfica exigiría dos ejes Y, que es el error más común de visualización y
 * distorsiona la comparación. Small multiples resuelve lo mismo sin mentir.
 *
 * Serie única ⇒ sin caja de leyenda: el título ya la nombra.
 */
function Facet({ title, points, dataKey, color, valueLabel }: FacetProps) {
  const gradientId = `trend-${dataKey}`

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      <div className="h-[168px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Grilla recesiva: el mismo tono de borde del resto de la app */}
            <CartesianGrid stroke={BRAND.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              allowDecimals={false}
            />
            <Tooltip
              content={<TrendTooltip valueLabel={valueLabel} />}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** W5 — Actividad de las últimas 12 semanas. */
export function TrendChart({ data, isLoading }: TrendChartProps) {
  return (
    <SectionCard
      icon={<Activity className="h-4 w-4" />}
      title="Activity"
      subtitle="Last 12 weeks"
    >
      {isLoading && <WidgetSkeleton rows={3} />}

      {!isLoading && !data && <WidgetPendingBackend label="Activity trend" />}

      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Facet
            title="Sessions"
            points={data.points}
            dataKey="sessions"
            color={BRAND.primary}
            valueLabel="sessions"
          />
          {/*
            Lleva token de ESTADO y no un color categórico porque la serie
            significa algo malo: una nota pendiente es trabajo atrasado, no
            "la serie 2". Es la excepción documentada a la regla de que los
            colores de estado no se reciclan como identidad de serie.
          */}
          <Facet
            title="Notes pending signature"
            points={data.points}
            dataKey="notesPending"
            color={STATUS_COLOR.serious}
            valueLabel="pending"
          />
        </div>
      )}
    </SectionCard>
  )
}
