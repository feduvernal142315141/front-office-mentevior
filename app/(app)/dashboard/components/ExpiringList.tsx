"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, CalendarClock, FileText, IdCard, PartyPopper, ShieldCheck, X } from "lucide-react"
import type { ExpiringItem, ExpiringKind } from "@/lib/types/dashboard.types"
import { EXPIRING_KIND_LABEL, formatDaysRemaining, sortExpiringItems } from "@/lib/modules/dashboard/utils/severity"
import type { AttentionFilter } from "./attention-filter"
import { SectionCard } from "@/components/custom/SectionCard"
import { Button } from "@/components/custom/Button"
import { SeverityBadge } from "./SeverityBadge"
import { SEVERITY_STYLES } from "./tokens"
import { WidgetEmptyState, WidgetPendingBackend, WidgetSkeleton } from "./WidgetStates"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<ExpiringKind, React.ElementType> = {
  PRIOR_AUTHORIZATION: ShieldCheck,
  CREDENTIAL: IdCard,
  CLIENT_DOCUMENT: FileText,
  HR_DOCUMENT: BadgeCheck,
}

const COLLAPSED_COUNT = 6

interface ExpiringListProps {
  /** Ya filtrados por rol y por el filtro activo del hero */
  items: ExpiringItem[]
  /** Si el backend todavía no entregó la sección */
  hasData: boolean
  isLoading?: boolean
  filter: AttentionFilter
  onClearFilter: () => void
}

/**
 * W3 — Vencimientos, en UNA lista.
 *
 * Las cuatro fuentes (autorizaciones, credenciales, documentos de cliente y de
 * staff) responden la misma pregunta: ¿cuántos días quedan? Cuando más de un
 * puñado de clases cargan significado, la forma correcta es una tabla — no más
 * colores ni cuatro tarjetas que obliguen a comparar de memoria.
 *
 * Ordena por severidad → días → tipo, con desempate estable para que la lista no
 * se reacomode entre refrescos.
 */
export function ExpiringList({ items, hasData, isLoading, filter, onClearFilter }: ExpiringListProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  const sorted = useMemo(() => sortExpiringItems(items), [items])
  const isFiltered = filter.type !== "all"

  // Con un filtro activo se muestra todo el grupo: colapsar justo lo que el
  // usuario acaba de pedir ver sería trabajarle en contra.
  const visible = expanded || isFiltered ? sorted : sorted.slice(0, COLLAPSED_COUNT)
  const hiddenCount = sorted.length - visible.length

  const filterLabel =
    filter.type === "critical"
      ? "Critical only"
      : filter.type === "kind"
        ? EXPIRING_KIND_LABEL[filter.kind]
        : null

  return (
    <SectionCard
      icon={<CalendarClock className="h-4 w-4" />}
      title="Needs your attention"
      subtitle={sorted.length > 0 ? `${sorted.length} expiring soon` : undefined}
      action={
        filterLabel ? (
          <button
            type="button"
            onClick={onClearFilter}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-[#037ECC]/30 bg-[#037ECC]/5",
              "px-2.5 py-1 text-[11px] font-semibold text-[#037ECC] transition-colors hover:bg-[#037ECC]/10",
              "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/30",
            )}
          >
            {filterLabel}
            <X className="h-3 w-3" aria-hidden />
          </button>
        ) : undefined
      }
      flush
    >
      <div className="px-5 py-4">
        {isLoading && <WidgetSkeleton rows={4} />}

        {!isLoading && !hasData && <WidgetPendingBackend label="Expirations" />}

        {!isLoading && hasData && sorted.length === 0 && (
          isFiltered ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">Nothing in this group</p>
              <Button variant="ghost" onClick={onClearFilter} className="mt-3">
                Show all items
              </Button>
            </div>
          ) : (
            <WidgetEmptyState
              icon={<PartyPopper className="h-5 w-5" />}
              title="Nothing expiring"
              description="No authorizations, credentials or documents expire in the next 60 days."
            />
          )
        )}

        {!isLoading && sorted.length > 0 && (
          <>
            <ul className="-mx-2 divide-y divide-slate-100">
              {visible.map((item) => {
                const Icon = KIND_ICON[item.kind]
                const styles = SEVERITY_STYLES[item.severity]
                const clickable = !!item.href

                return (
                  <li key={item.id}>
                    <div
                      role={clickable ? "button" : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={() => item.href && router.push(item.href)}
                      onKeyDown={(event) => {
                        if (!item.href) return
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          router.push(item.href)
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-l-2 px-3 py-3 transition-colors",
                        styles.row,
                        clickable && "cursor-pointer hover:bg-slate-50",
                        "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/30",
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                        <Icon className="h-4 w-4 text-slate-500" aria-hidden />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="truncate text-xs text-slate-500">
                          {item.subject} · {EXPIRING_KIND_LABEL[item.kind]}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={cn(
                            "hidden text-xs font-medium tabular-nums sm:block",
                            item.daysRemaining < 0 ? "text-[#d03b3b]" : "text-slate-500",
                          )}
                        >
                          {formatDaysRemaining(item.daysRemaining)}
                        </span>
                        <SeverityBadge severity={item.severity} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {!isFiltered && (hiddenCount > 0 || expanded) && (
              <div className="mt-3 flex justify-center">
                <Button variant="ghost" onClick={() => setExpanded((prev) => !prev)}>
                  {expanded ? "Show less" : `Show ${hiddenCount} more`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </SectionCard>
  )
}
