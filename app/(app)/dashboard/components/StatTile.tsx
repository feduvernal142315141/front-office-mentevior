import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"
import type { KpiValue, Severity } from "@/lib/types/dashboard.types"
import { Meter } from "./Meter"
import { Sparkline } from "./Sparkline"
import { BRAND } from "./tokens"
import { cn } from "@/lib/utils"

interface StatTileProps {
  label: string
  kpi?: KpiValue
  icon?: React.ReactNode
  /** Severidad del medidor cuando el KPI es un ratio contra un tope */
  meterSeverity?: Severity
  /** Texto al pie, ej. "de 12 esperados" */
  footnote?: string
}

/** 1284 → "1,284" · 12900 → "12.9K" */
function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 10_000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString("en-US")
}

export function StatTile({ label, kpi, icon, meterSeverity, footnote }: StatTileProps) {
  if (!kpi) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <p className="mt-3 text-sm text-slate-400">Pending backend</p>
      </div>
    )
  }

  const { value, unit, deltaPercent, deltaDirection = "flat", higherIsBetter = true, sparkline, target } = kpi

  // El color del delta depende de la DIRECCIÓN y de si subir es bueno para este
  // KPI: sin eso, "notas pendientes ▲30%" se pintaría de verde.
  const isGoodDelta =
    deltaDirection === "flat" ? null : (deltaDirection === "up") === higherIsBetter

  const DeltaIcon =
    deltaDirection === "up" ? ArrowUpRight : deltaDirection === "down" ? ArrowDownRight : ArrowRight

  const showMeter = typeof target === "number" && target > 0 && meterSeverity
  const meterPercent = showMeter ? (unit === "%" ? value : (value / target!) * 100) : 0

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm",
        "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#037ECC]">{icon}</span>}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>

      <div className="mt-2 flex items-end gap-2">
        {/* Figuras proporcionales a propósito: `tabular-nums` sólo en columnas */}
        <span className="text-3xl font-semibold leading-none text-slate-900">
          {formatCompact(value)}
          {unit && <span className="ml-0.5 text-xl text-slate-400">{unit}</span>}
        </span>

        {typeof deltaPercent === "number" && deltaDirection !== "flat" && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold",
              isGoodDelta ? "text-[#006300]" : "text-[#d03b3b]",
            )}
          >
            <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
            {Math.abs(deltaPercent).toFixed(deltaPercent % 1 === 0 ? 0 : 1)}%
          </span>
        )}
      </div>

      {footnote && <p className="mt-1.5 text-xs text-slate-500">{footnote}</p>}

      {showMeter && <Meter percent={meterPercent} severity={meterSeverity!} className="mt-3" />}

      {!showMeter && sparkline && sparkline.length > 1 && (
        <div className="mt-3 -mb-1 h-8">
          <Sparkline points={sparkline} accent={BRAND.primary} className="h-8 w-full" />
        </div>
      )}
    </div>
  )
}
