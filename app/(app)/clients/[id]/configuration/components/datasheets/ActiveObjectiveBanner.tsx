"use client"

import { useMemo } from "react"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClientServicePlanItemObjective } from "@/lib/types/client-service-plan.types"

interface ActiveObjectiveBannerProps {
  objectives?: ClientServicePlanItemObjective[] | null
}

function normalizeStatus(status?: string): "in_progress" | "not_started" | "mastered" | null {
  if (!status) return null
  const n = status.replace(/[\s_-]/g, "").toLowerCase()
  if (n === "inprogress") return "in_progress"
  if (n === "mastered") return "mastered"
  if (n === "notstarted") return "not_started"
  return null
}

const STATUS_STYLES = {
  in_progress: {
    badge: "bg-[#037ECC]/10 text-[#037ECC] border-[#037ECC]/20",
    label: "In Progress",
    border: "border-[#037ECC]/20",
    bg: "bg-[#037ECC]/[0.03]",
    icon: "text-[#037ECC]",
  },
  mastered: {
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    label: "Mastered",
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
    icon: "text-emerald-500",
  },
  not_started: {
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    label: "Not Started",
    border: "border-slate-200",
    bg: "bg-slate-50/50",
    icon: "text-slate-400",
  },
} as const

export function ActiveObjectiveBanner({ objectives }: ActiveObjectiveBannerProps) {
  const activeObjective = useMemo(() => {
    if (!objectives || objectives.length === 0) return null
    // Find "In Progress" objective
    const inProgress = objectives.find((o) => normalizeStatus(o.status) === "in_progress")
    if (inProgress) return inProgress
    // Fallback: first objective with a startDate
    const withStart = objectives.filter((o) => o.startDate).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    return withStart[0] ?? null
  }, [objectives])

  if (!activeObjective) return null

  const status = normalizeStatus(activeObjective.status) ?? "not_started"
  const style = STATUS_STYLES[status]
  // Extract STO number from name (e.g., "STO#3: ...")
  const stoMatch = activeObjective.name.match(/STO#?(\d+)/i)
  const stoLabel = stoMatch ? `STO#${stoMatch[1]}` : null

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3.5", style.border, style.bg)}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.badge)}>
        <Target className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {stoLabel && (
            <span className="text-xs font-bold text-slate-800">{stoLabel}</span>
          )}
          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", style.badge)}>
            {style.label}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {activeObjective.name.replace(/^STO#?\d+:\s*/i, "")}
        </p>
      </div>
    </div>
  )
}
