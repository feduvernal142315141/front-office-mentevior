"use client"

import { useCallback, useRef, useState } from "react"
import { Info, Minus, Plus, Activity, Pencil, X, Check, RotateCcw } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import { cn } from "@/lib/utils"
import type { ClientServicePlanCategoryMappedItem } from "@/lib/types/client-service-plan.types"
import {
  type TrialResult,
  cycleTrialResult,
  calculatePercentage,
  countYes,
} from "./percentage-datasheet.types"

interface OnsiteCollectionGridProps {
  items: ClientServicePlanCategoryMappedItem[]
  categoryTypeName: string | null
  categoryId: string
}

// ─── Per-item state ──────────────────────────────────────────────────────────

interface FrequencyItemState {
  count: number
  history: { t: number; v: number }[]
}

interface PercentageItemState {
  numberOfTrials: number
  trials: TrialResult[]
  history: { t: number; v: number }[]
}

type TaskResult = "accepted" | "rejected" | "na" | null

const DEFAULT_TASK_TRIALS = 10

interface TaskAcceptanceItemState {
  numberOfTrials: number
  trials: TaskResult[]       // fixed-length array, null = unanswered
  history: { t: number; v: number }[]
}

type ItemState = FrequencyItemState | PercentageItemState | TaskAcceptanceItemState
type ItemStates = Record<string, ItemState>

function isPercentageType(typeName: string | null): boolean {
  return typeName === "Percentage of Opportunities"
}

const TASK_CATEGORY_IDS = new Set([
  "105534c4-7938-41ae-8b25-90d1d0380912", // Acquisition Programs
  "e9d422f7-6630-41fc-a618-78164344b458", // Caregivers Programs
])

function isTaskAcceptanceCategory(categoryId: string): boolean {
  return TASK_CATEGORY_IDS.has(categoryId)
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function OnsiteCollectionGrid({ items, categoryTypeName, categoryId }: OnsiteCollectionGridProps) {
  const [states, setStates] = useState<ItemStates>({})
  const isPercentage = isPercentageType(categoryTypeName)
  const isTaskAcceptance = isTaskAcceptanceCategory(categoryId)
  const seqRef = useRef(0)

  const getFrequencyState = useCallback(
    (itemId: string): FrequencyItemState =>
      (states[itemId] as FrequencyItemState) ?? { count: 0, history: [] },
    [states]
  )

  const getPercentageState = useCallback(
    (itemId: string): PercentageItemState => {
      const existing = states[itemId] as PercentageItemState | undefined
      return existing ?? { numberOfTrials: 10, trials: Array.from({ length: 10 }, () => null), history: [] }
    },
    [states]
  )

  const getTaskState = useCallback(
    (itemId: string): TaskAcceptanceItemState => {
      const existing = states[itemId] as TaskAcceptanceItemState | undefined
      return existing ?? { numberOfTrials: DEFAULT_TASK_TRIALS, trials: Array.from({ length: DEFAULT_TASK_TRIALS }, () => null), history: [] }
    },
    [states]
  )

  const updateState = useCallback(
    (itemId: string, updater: (prev: ItemState) => ItemState) => {
      setStates((prev) => {
        let fallback: ItemState
        if (isTaskAcceptance) {
          fallback = { numberOfTrials: DEFAULT_TASK_TRIALS, trials: Array.from({ length: DEFAULT_TASK_TRIALS }, () => null), history: [] }
        } else if (isPercentage) {
          fallback = { numberOfTrials: 10, trials: Array.from({ length: 10 }, () => null), history: [] }
        } else {
          fallback = { count: 0, history: [] }
        }
        const current = prev[itemId] ?? fallback
        return { ...prev, [itemId]: updater(current) }
      })
    },
    [isPercentage, isTaskAcceptance]
  )

  const nextSeq = useCallback(() => {
    seqRef.current += 1
    return seqRef.current
  }, [])

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
        <p className="text-sm text-slate-500">No items in this category</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) =>
        isTaskAcceptance ? (
          <TaskAcceptanceCard
            key={item.id}
            item={item}
            categoryTypeName={categoryTypeName}
          />
        ) : isPercentage ? (
          <PercentageCard
            key={item.id}
            item={item}
            state={getPercentageState(item.id)}
            onUpdate={(updater) => updateState(item.id, updater as (prev: ItemState) => PercentageItemState)}
            nextSeq={nextSeq}
          />
        ) : (
          <FrequencyCard
            key={item.id}
            item={item}
            state={getFrequencyState(item.id)}
            onUpdate={(updater) => updateState(item.id, updater as (prev: ItemState) => FrequencyItemState)}
            nextSeq={nextSeq}
          />
        )
      )}
    </div>
  )
}

// ─── Mini Sparkline ──────────────────────────────────────────────────────────

function MiniSparkline({ data, color, gradientId }: { data: { t: number; v: number }[]; color: string; gradientId: string }) {
  if (data.length < 2) return null
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Progress Ring ───────────────────────────────────────────────────────────

function ProgressRing({ percentage, size = 100, strokeWidth = 8 }: { percentage: number | null; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = percentage ?? 0
  const offset = circumference - (pct / 100) * circumference

  const color = pct === 0 ? "#CBD5E1" : pct >= 60 ? "#037ECC" : pct < 40 ? "#EF4444" : "#037ECC"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          "text-xl font-bold tabular-nums leading-none",
          pct === 0 ? "text-slate-300" : "text-slate-800"
        )}>
          {percentage !== null ? `${pct}%` : "N/A"}
        </span>
      </div>
    </div>
  )
}

// ─── Task Acceptance Card ────────────────────────────────────────────────────

function TaskAcceptanceCard({
  item,
  categoryTypeName,
}: {
  item: ClientServicePlanCategoryMappedItem
  categoryTypeName: string | null
}) {
  const [records, setRecords] = useState<TaskResult[]>([])
  const [history, setHistory] = useState<{ t: number; v: number }[]>([])
  const seqRef = useRef(0)

  // N/A does not count toward the percentage — only correct vs incorrect
  const correct = records.filter((r) => r === "accepted").length
  const incorrect = records.filter((r) => r === "rejected").length
  const evaluated = correct + incorrect // opportunities with a real outcome
  const total = records.length           // all records including N/A
  const pct = evaluated > 0 ? Math.round((correct / evaluated) * 100) : null

  const addRecord = (result: TaskResult) => {
    setRecords((prev) => {
      const next = [...prev, result]
      const c = next.filter((r) => r === "accepted").length
      const e = c + next.filter((r) => r === "rejected").length
      const p = e > 0 ? Math.round((c / e) * 100) : 0
      seqRef.current += 1
      setHistory((h) => [...h, { t: seqRef.current, v: p }])
      return next
    })
  }

  const undoLast = () => {
    setRecords((prev) => {
      if (prev.length === 0) return prev
      const next = prev.slice(0, -1)
      const c = next.filter((r) => r === "accepted").length
      const e = c + next.filter((r) => r === "rejected").length
      const p = e > 0 ? Math.round((c / e) * 100) : 0
      seqRef.current += 1
      setHistory((h) => [...h, { t: seqRef.current, v: p }])
      return next
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
            total > 0 ? "bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10" : "bg-slate-100"
          )}>
            <Pencil className={cn("h-4 w-4", total > 0 ? "text-[#037ECC]" : "text-slate-400")} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800 uppercase leading-tight">{item.itemName}</h4>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
              {categoryTypeName ?? "Percentage of Opportunities"}
            </p>
          </div>
        </div>
        <button
          type="button"
          title="Item details"
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Ring */}
      <div className="flex flex-col items-center px-5 py-5">
        <ProgressRing percentage={pct} size={110} strokeWidth={9} />
        <span className="text-xs text-slate-400 mt-2">
          {evaluated > 0 ? `${correct}/${evaluated} Correct` : "No opportunities yet"}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-2.5 px-5 pb-5">
        <button
          type="button"
          onClick={() => addRecord("na")}
          className="flex h-11 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
        >
          N/A
        </button>
        <button
          type="button"
          onClick={() => addRecord("rejected")}
          className="flex h-11 w-14 items-center justify-center rounded-xl bg-red-500 text-white transition-all hover:bg-red-600 active:scale-95 shadow-sm"
        >
          <X className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => addRecord("accepted")}
          className="flex h-11 w-14 items-center justify-center rounded-xl bg-emerald-500 text-white transition-all hover:bg-emerald-600 active:scale-95 shadow-sm"
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={undoLast}
          disabled={total === 0}
          className="flex h-11 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 active:scale-95 disabled:opacity-30"
        >
          <RotateCcw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Sparkline */}
      <div className="px-5">
        <MiniSparkline data={history} color="#037ECC" gradientId={`task-${item.id}`} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 pb-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {total > 0 ? `${total} opportunities` : "No records yet"}
        </span>
        <span className={cn("text-xs font-semibold", total > 0 ? "text-[#037ECC]" : "text-slate-400")}>
          {total > 0 ? "Recording" : "New target"}
        </span>
      </div>
    </div>
  )
}

// ─── Frequency Card ──────────────────────────────────────────────────────────

function FrequencyCard({
  item,
  state,
  onUpdate,
  nextSeq,
}: {
  item: ClientServicePlanCategoryMappedItem
  state: FrequencyItemState
  onUpdate: (updater: (prev: FrequencyItemState) => FrequencyItemState) => void
  nextSeq: () => number
}) {
  const hasData = state.count > 0

  const increment = () => {
    onUpdate((s) => ({
      ...s,
      count: s.count + 1,
      history: [...s.history, { t: nextSeq(), v: s.count + 1 }],
    }))
  }

  const decrement = () => {
    onUpdate((s) => {
      const next = Math.max(0, s.count - 1)
      return {
        ...s,
        count: next,
        history: [...s.history, { t: nextSeq(), v: next }],
      }
    })
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white transition-all duration-200 hover:shadow-md",
        hasData ? "border-[#037ECC]/20 shadow-sm" : "border-slate-200 shadow-sm"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            hasData ? "bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10" : "bg-slate-100"
          )}>
            <Activity className={cn("h-4.5 w-4.5", hasData ? "text-[#037ECC]" : "text-slate-400")} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 uppercase truncate">{item.itemName}</h4>
        </div>
        <button
          type="button"
          title="Item details"
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-center gap-4 px-5 py-6">
        <button
          type="button"
          onClick={decrement}
          disabled={state.count === 0}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-all hover:bg-red-100 hover:text-red-500 active:scale-95 disabled:opacity-30 disabled:hover:bg-red-50 disabled:hover:text-red-400"
        >
          <Minus className="h-5 w-5" strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center min-w-[80px]">
          <span className={cn("text-5xl font-bold tabular-nums leading-none transition-colors", hasData ? "text-slate-800" : "text-slate-300")}>
            {state.count}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1.5">Total</span>
        </div>

        <button
          type="button"
          onClick={increment}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#037ECC] text-white transition-all hover:bg-[#025f9a] active:scale-95 shadow-sm"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Sparkline */}
      <div className="px-5">
        <MiniSparkline data={state.history} color="#037ECC" gradientId={`freq-${item.id}`} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 pb-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {hasData ? `${state.history.length} records` : "No records yet"}
        </span>
        <span className={cn("text-xs font-semibold", hasData ? "text-[#037ECC]" : "text-slate-400")}>
          {hasData ? "Frequency" : "New target"}
        </span>
      </div>
    </div>
  )
}

// ─── Percentage Card ─────────────────────────────────────────────────────────

function PercentageCard({
  item,
  state,
  onUpdate,
  nextSeq,
}: {
  item: ClientServicePlanCategoryMappedItem
  state: PercentageItemState
  onUpdate: (updater: (prev: PercentageItemState) => PercentageItemState) => void
  nextSeq: () => number
}) {
  const entry = {
    trials: state.trials.map((r) => ({ result: r })),
    numberOfTrials: state.numberOfTrials,
    initials: "",
    environmentalNote: "",
  }
  const pct = calculatePercentage(entry)
  const answered = entry.trials.filter((t) => t.result !== null).length

  const handleToggle = (idx: number) => {
    onUpdate((s) => {
      const newTrials = [...s.trials]
      newTrials[idx] = cycleTrialResult(s.trials[idx])
      const tempEntry = {
        trials: newTrials.map((r) => ({ result: r })),
        numberOfTrials: s.numberOfTrials,
        initials: "",
        environmentalNote: "",
      }
      const newPct = calculatePercentage(tempEntry)
      const hist = newPct !== null
        ? [...s.history, { t: nextSeq(), v: newPct }]
        : s.history
      return { ...s, trials: newTrials, history: hist }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            answered > 0 ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10" : "bg-slate-100"
          )}>
            <Activity className={cn("h-4.5 w-4.5", answered > 0 ? "text-emerald-500" : "text-slate-400")} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 uppercase truncate">{item.itemName}</h4>
        </div>
        {pct !== null ? (
          <div className="flex flex-col items-end shrink-0">
            <span className={cn(
              "text-xl font-bold tabular-nums leading-none",
              pct >= 60 ? "bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent" : "text-slate-700"
            )}>
              {pct}%
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Accuracy</span>
          </div>
        ) : (
          <button
            type="button"
            title="Item details"
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Trial toggles */}
      <div className="grid grid-cols-5 gap-1.5 px-5 py-5">
        {state.trials.map((result, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleToggle(idx)}
            className={cn(
              "h-9 rounded-lg text-xs font-bold transition-all duration-150 border",
              result === "yes" && "bg-emerald-500 border-emerald-500 text-white shadow-sm",
              result === "no" && "bg-red-500 border-red-500 text-white shadow-sm",
              result === null && "bg-slate-100 border-slate-200 text-slate-400 border-dashed hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            {result === "yes" ? "Y" : result === "no" ? "N" : "?"}
          </button>
        ))}
      </div>

      {/* Sparkline */}
      <div className="px-5">
        <MiniSparkline data={state.history} color="#22C55E" gradientId={`pct-${item.id}`} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 pb-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Trials: {answered}/{state.numberOfTrials} completed
        </span>
        <span className={cn("text-xs font-semibold", answered > 0 ? "text-emerald-500" : "text-slate-400")}>
          {answered > 0 ? "Percentage" : "New target"}
        </span>
      </div>
    </div>
  )
}
