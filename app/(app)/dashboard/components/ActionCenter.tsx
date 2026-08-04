"use client"

import { useMemo } from "react"
import { CheckCircle2, ShieldAlert } from "lucide-react"
import type { ActionCenterSummary, ExpiringItem, ExpiringKind, Severity } from "@/lib/types/dashboard.types"
import { EXPIRING_KIND_LABEL, formatDaysRemaining } from "@/lib/modules/dashboard/utils/severity"
import { SEVERITY_STYLES } from "./tokens"
import { type AttentionFilter, ALL_FILTER, isSameFilter } from "./attention-filter"
import { cn } from "@/lib/utils"

interface ActionCenterProps {
  summary?: ActionCenterSummary
  /** Ya filtrados por rol: el hero y la lista tienen que contar lo mismo */
  items?: ExpiringItem[]
  filter: AttentionFilter
  onFilterChange: (filter: AttentionFilter) => void
  isLoading?: boolean
  userName?: string
}

const KIND_ORDER: ExpiringKind[] = [
  "PRIOR_AUTHORIZATION",
  "CREDENTIAL",
  "CLIENT_DOCUMENT",
  "HR_DOCUMENT",
]

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, serious: 1, warning: 2, good: 3 }

interface KindChip {
  kind: ExpiringKind
  count: number
  worstSeverity: Severity
  soonestDays: number
}

/**
 * W1 — La cifra que encabeza la vista, con los chips como puerta de entrada.
 *
 * Los chips no son etiquetas: son filtros. Un conteo suelto ("3 Credentials") no
 * dice qué atención merece, así que cada chip además lleva **la peor severidad**
 * y **el vencimiento más próximo** de su grupo — que es la información que
 * convierte un número en una decisión.
 */
export function ActionCenter({
  summary,
  items,
  filter,
  onFilterChange,
  isLoading,
  userName,
}: ActionCenterProps) {
  const firstName = userName?.trim().split(" ")[0]

  const { total, criticalCount, chips } = useMemo(() => {
    // Se deriva de los items reales cuando están, para que el hero nunca cuente
    // algo distinto de lo que la lista muestra.
    if (items && items.length > 0) {
      const grouped = new Map<ExpiringKind, KindChip>()

      for (const item of items) {
        const current = grouped.get(item.kind)
        if (!current) {
          grouped.set(item.kind, {
            kind: item.kind,
            count: 1,
            worstSeverity: item.severity,
            soonestDays: item.daysRemaining,
          })
          continue
        }
        current.count += 1
        if (SEVERITY_RANK[item.severity] < SEVERITY_RANK[current.worstSeverity]) {
          current.worstSeverity = item.severity
        }
        if (item.daysRemaining < current.soonestDays) current.soonestDays = item.daysRemaining
      }

      return {
        total: items.length,
        criticalCount: items.filter((i) => i.severity === "critical").length,
        chips: KIND_ORDER.map((kind) => grouped.get(kind)).filter(Boolean) as KindChip[],
      }
    }

    // Respaldo: backend mandó el resumen pero todavía no el detalle
    if (summary) {
      return {
        total: summary.total,
        criticalCount: summary.criticalCount,
        chips: KIND_ORDER.flatMap((kind) => {
          const count = summary.byKind[kind]
          return count ? [{ kind, count, worstSeverity: "warning" as Severity, soonestDays: NaN }] : []
        }),
      }
    }

    return { total: 0, criticalCount: 0, chips: [] as KindChip[] }
  }, [items, summary])

  const criticalActive = isSameFilter(filter, { type: "critical" })

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#037ECC]/20 shadow-sm",
        "bg-gradient-to-br from-[#037ECC]/[0.07] via-white to-[#079CFB]/[0.05]",
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #079CFB33 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
        {firstName && (
          <p className="text-sm text-slate-500">
            Good to see you, <span className="font-semibold text-slate-700">{firstName}</span>
          </p>
        )}

        {isLoading ? (
          <div className="mt-3 flex items-end gap-4">
            <div className="h-14 w-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mb-2 h-4 w-48 animate-pulse rounded-full bg-slate-100" />
          </div>
        ) : total === 0 ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#0ca30c]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">Everything is up to date</p>
              <p className="text-sm text-slate-500">No expirations in the next 60 days.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="text-[56px] font-semibold leading-none tracking-tight text-slate-900">
                {total}
              </span>
              <span className="mb-2 text-lg font-medium text-slate-600">
                {total === 1 ? "item needs your attention" : "items need your attention"}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">Pick a group to filter the list below</p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {criticalCount > 0 && (
                <FilterChip
                  active={criticalActive}
                  onClick={() => onFilterChange(criticalActive ? ALL_FILTER : { type: "critical" })}
                  className={cn(
                    "border-red-200 bg-red-50 text-red-700",
                    criticalActive && "ring-2 ring-red-300 ring-offset-1",
                  )}
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                  <span className="font-semibold">{criticalCount} critical</span>
                </FilterChip>
              )}

              {chips.map((chip) => {
                const active = isSameFilter(filter, { type: "kind", kind: chip.kind })
                const styles = SEVERITY_STYLES[chip.worstSeverity]
                const label = EXPIRING_KIND_LABEL[chip.kind] + (chip.count > 1 ? "s" : "")

                return (
                  <FilterChip
                    key={chip.kind}
                    active={active}
                    onClick={() => onFilterChange(active ? ALL_FILTER : { type: "kind", kind: chip.kind })}
                    className={cn(
                      "border-slate-200 bg-white/80 text-slate-600",
                      active && "border-[#037ECC]/40 bg-[#037ECC]/5 ring-2 ring-[#037ECC]/25 ring-offset-1",
                    )}
                  >
                    {/* El punto de severidad es la señal que faltaba: dice si el
                        grupo es urgente antes de abrirlo */}
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} aria-hidden />
                    <span className="font-semibold text-slate-900">{chip.count}</span>
                    <span>{label}</span>
                    {Number.isFinite(chip.soonestDays) && (
                      <span className="text-slate-400">· {formatDaysRemaining(chip.soonestDays)}</span>
                    )}
                  </FilterChip>
                )
              })}

              {filter.type !== "all" && (
                <button
                  type="button"
                  onClick={() => onFilterChange(ALL_FILTER)}
                  className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
        "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/30 focus:ring-offset-1",
        className,
      )}
    >
      {children}
    </button>
  )
}
