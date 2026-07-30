"use client"

import { TrendingUp, TrendingDown, Minus, BarChart3, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { linearRegression } from "./duration-datasheet.types"

/**
 * Trend analysis is always evaluated against the objective (STO) currently in progress:
 * - only datapoints inside the active objective's window are considered
 * - "Increasing"/"Decreasing" is coloured by whether it moves TOWARD the objective's
 *   smart criteria (e.g. "≤ 43" → decreasing is good, "≥ 80" → increasing is good)
 */

export interface TrendObjectiveLike {
  name?: string
  status?: string
  startDate?: string
  endDate?: string | null
  operatorSmartCriteria?: string
  valueSmartCriteria?: number
}

export type TrendTone = "good" | "bad" | "neutral"

export interface TrendInfo {
  slope: number
  intercept: number
  direction: "Increasing" | "Decreasing" | "Stable"
  arrow: string
  count: number
  tone: TrendTone
  /** e.g. "STO#2" when the objective name carries it */
  stoLabel: string | null
  /** e.g. "≤ 43" */
  criteriaLabel: string | null
  /** Most recent datapoint inside the objective window */
  lastValue: number | null
  /** Whether that last value satisfies the objective's smart criteria (null = no criteria) */
  meetsCriteria: boolean | null
}

const OPERATOR_SYMBOLS: Record<string, string> = {
  GT: ">",
  GTE: "≥",
  EQ: "=",
  LT: "<",
  LTE: "≤",
}

/** Does `value` satisfy `operator target`? Returns null when there is no usable criteria. */
function evaluateCriteria(value: number, operator: string, target?: number): boolean | null {
  if (target == null) return null
  switch (operator) {
    case "LT": return value < target
    case "LTE": return value <= target
    case "GT": return value > target
    case "GTE": return value >= target
    case "EQ": return value === target
    default: return null
  }
}

function normalizeStatus(status?: string): "in_progress" | "not_started" | "mastered" | null {
  if (!status) return null
  const n = status.replace(/[\s_-]/g, "").toLowerCase()
  if (n === "inprogress") return "in_progress"
  if (n === "mastered") return "mastered"
  if (n === "notstarted") return "not_started"
  return null
}

/**
 * Resolves the objective the chart trend refers to: the one In Progress, otherwise the
 * most recent one that already started and hasn't ended.
 */
export function resolveActiveObjective(
  primary?: TrendObjectiveLike[] | null,
  fallback?: TrendObjectiveLike[] | null,
): TrendObjectiveLike | null {
  const list: TrendObjectiveLike[] = primary && primary.length > 0 ? primary : fallback ?? []
  if (list.length === 0) return null

  const inProgress = list.find((o) => normalizeStatus(o.status) === "in_progress")
  if (inProgress) return inProgress

  const started = list
    .filter((o) => o.startDate)
    .sort((a, b) => parsePointDate(a.startDate!)!.getTime() - parsePointDate(b.startDate!)!.getTime())
  if (started.length === 0) return null

  const stillOpen = [...started].reverse().find((o) => !o.endDate)
  return stillOpen ?? started[started.length - 1]
}

/**
 * Parses the key of a chart datapoint. Daily keys are "YYYY-MM-DD"; aggregated keys can be
 * "YYYY-MM" (monthly), "YYYY" (yearly) or "YYYY-Qn" (quarterly).
 */
export function parsePointDate(key: string): Date | null {
  if (!key) return null
  const iso = key.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  const quarter = key.match(/^(\d{4})-Q(\d)$/)
  if (quarter) return new Date(Number(quarter[1]), (Number(quarter[2]) - 1) * 3, 1)
  if (/^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split("-").map(Number)
    return new Date(y, m - 1, 1)
  }
  if (/^\d{4}$/.test(key)) return new Date(Number(key), 0, 1)
  return null
}

interface TrendPoint {
  dateKey?: string
  value: number | null
  isBaseline?: boolean
}

export function computeTrendInfo(
  points: TrendPoint[],
  objective: TrendObjectiveLike | null,
): TrendInfo | null {
  const start = objective?.startDate ? parsePointDate(objective.startDate) : null
  const end = objective?.endDate ? parsePointDate(objective.endDate) : null

  const valuePoints = points.filter((p) => {
    if (p.isBaseline || p.value == null) return false
    if (!start) return true
    const date = p.dateKey ? parsePointDate(p.dateKey) : null
    if (!date) return true
    if (date.getTime() < start.getTime()) return false
    if (end && date.getTime() > end.getTime()) return false
    return true
  })

  if (valuePoints.length < 2) return null

  const reg = linearRegression(valuePoints.map((p, i) => ({ x: i, y: p.value! })))
  if (!reg) return null

  const direction = reg.slope > 0.01 ? "Increasing" : reg.slope < -0.01 ? "Decreasing" : "Stable"
  const arrow = reg.slope > 0.01 ? "↑" : reg.slope < -0.01 ? "↓" : "→"

  // Which way does the objective want the data to move?
  const operator = (objective?.operatorSmartCriteria ?? "").trim().toUpperCase()
  const favorable: "up" | "down" | null =
    operator === "LT" || operator === "LTE" ? "down"
    : operator === "GT" || operator === "GTE" ? "up"
    : null

  // Is the objective actually being met right now? (latest datapoint vs smart criteria)
  const lastValue = valuePoints[valuePoints.length - 1].value!
  const meetsCriteria = evaluateCriteria(lastValue, operator, objective?.valueSmartCriteria)

  const movingToward: boolean | null =
    favorable == null ? null : favorable === "down" ? reg.slope < -0.01 : reg.slope > 0.01

  // Green only when the criteria is met. Moving toward it but not there yet stays neutral,
  // so a "Decreasing" trend never reads as success while the value is still off target.
  const tone: TrendTone =
    meetsCriteria === true ? "good"
    : meetsCriteria === null && movingToward === null ? "neutral"
    : movingToward === true ? "neutral"
    : "bad"

  const stoMatch = objective?.name?.match(/STO#?(\d+)/i)
  const symbol = OPERATOR_SYMBOLS[operator]
  const criteriaLabel =
    symbol && objective?.valueSmartCriteria != null ? `${symbol} ${objective.valueSmartCriteria}` : null

  return {
    ...reg,
    direction,
    arrow,
    count: valuePoints.length,
    tone,
    stoLabel: stoMatch ? `STO#${stoMatch[1]}` : null,
    criteriaLabel,
    lastValue,
    meetsCriteria,
  }
}

export function TrendFooter({ trend, compact = false }: { trend: TrendInfo | null; compact?: boolean }) {
  if (!trend) return null

  const Icon = trend.direction === "Increasing" ? TrendingUp : trend.direction === "Decreasing" ? TrendingDown : Minus
  const iconTone = trend.tone === "good" ? "text-emerald-500" : trend.tone === "bad" ? "text-rose-500" : "text-amber-500"
  const textTone = trend.tone === "good" ? "text-emerald-600" : trend.tone === "bad" ? "text-rose-600" : "text-amber-600"
  const objectiveChip = [trend.stoLabel, trend.criteriaLabel].filter(Boolean).join(" · ")

  return (
    <div className={cn(
      "mt-4 flex items-center rounded-xl bg-slate-50/80 border border-slate-100 px-4 py-2.5",
      compact ? "flex-wrap gap-x-3 gap-y-1.5" : "gap-4",
    )}>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">
          Datapoints: <span className="text-slate-800 tabular-nums">{trend.count}</span>
        </span>
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", iconTone)} />
        <span className="text-xs font-semibold text-slate-600">
          Total: <span className={textTone}>{trend.arrow} {trend.direction}</span>
        </span>
      </div>
      {objectiveChip && (
        <>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5" title="Trend measured against the objective in progress">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">{objectiveChip}</span>
          </div>
        </>
      )}
      {trend.meetsCriteria != null && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            trend.meetsCriteria
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : "bg-rose-50 border-rose-200 text-rose-600",
          )}
          title={`Last value: ${trend.lastValue}`}
        >
          {trend.meetsCriteria ? "Met" : "Not met"}
          <span className="tabular-nums font-semibold">({trend.lastValue})</span>
        </span>
      )}
      <div className="h-4 w-px bg-slate-200" />
      <span className="text-[11px] text-slate-400 tabular-nums">
        slope: {trend.slope.toFixed(2)} &middot; alpha: {trend.intercept.toFixed(2)}
      </span>
    </div>
  )
}
