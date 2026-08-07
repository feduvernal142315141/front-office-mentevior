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
import { Activity, LineChart } from "lucide-react"
import type { TrendPoint } from "@/lib/types/dashboard.types"
import { SectionCard } from "@/components/custom/SectionCard"
import { BRAND } from "./tokens"
import { WidgetEmptyState, WidgetPendingBackend, WidgetSkeleton } from "./WidgetStates"

interface TrendChartProps {
  data?: { points: TrendPoint[] }
  isLoading?: boolean
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
 * Serie única de sesiones por semana.
 *
 * Antes esto eran dos facetas —sesiones y notas pendientes— con escala propia
 * cada una. El backend dejó de mandar la serie de notas (contrato 2026-08-07):
 * ahora sólo llega el acumulado, que vive en la fila de KPIs.
 *
 * Serie única ⇒ sin caja de leyenda: el encabezado de la tarjeta ya la nombra.
 */
function SessionsTrend({ points }: { points: TrendPoint[] }) {
  const color = BRAND.primary
  const gradientId = "trend-sessions"

  return (
    <div className="h-[200px]">
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
            content={<TrendTooltip valueLabel="sessions" />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** W5 — Sesiones de las últimas 12 semanas. */
export function TrendChart({ data, isLoading }: TrendChartProps) {
  return (
    <SectionCard
      icon={<Activity className="h-4 w-4" />}
      title="Activity"
      subtitle="Sessions · last 12 weeks"
    >
      {isLoading && <WidgetSkeleton rows={3} />}

      {!isLoading && !data && <WidgetPendingBackend label="Activity trend" />}

      {/* Ejes vacíos sugieren "cero actividad"; sin puntos no hay nada que
          afirmar, así que se dice explícitamente. */}
      {!isLoading && data && data.points.length === 0 && (
        <WidgetEmptyState
          icon={<LineChart className="h-5 w-5" />}
          title="No activity yet"
          description="Once sessions are logged, the last 12 weeks will show up here."
          tone="neutral"
        />
      )}

      {!isLoading && data && data.points.length > 0 && <SessionsTrend points={data.points} />}
    </SectionCard>
  )
}
