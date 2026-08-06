import { FolderCheck, FolderOpen } from "lucide-react"
import type { DocumentComplianceBreakdown } from "@/lib/types/dashboard.types"
import { SectionCard } from "@/components/custom/SectionCard"
import { STATUS_COLOR } from "./tokens"
import { WidgetEmptyState, WidgetPendingBackend, WidgetSkeleton } from "./WidgetStates"

interface DocumentComplianceProps {
  data?: DocumentComplianceBreakdown
  isLoading?: boolean
}

const SEGMENTS = [
  { key: "delivered", label: "Delivered", color: STATUS_COLOR.good },
  { key: "pending", label: "Pending", color: "#94A3B8" },
  { key: "nearExpiration", label: "Near expiration", color: STATUS_COLOR.warning },
  { key: "expired", label: "Expired", color: STATUS_COLOR.critical },
] as const

/**
 * W6 — Cumplimiento documental.
 *
 * Parte-de-un-todo se resuelve con una barra apilada, no con una dona: comparar
 * ángulos es más difícil que comparar longitudes, y con cuatro segmentos la dona
 * sólo agrega decoración.
 *
 * Se dibuja con flex en vez de una librería de gráficas — es una sola barra, y
 * así controlamos exactamente la separación de 2px entre segmentos.
 */
export function DocumentCompliance({ data, isLoading }: DocumentComplianceProps) {
  const total = data ? SEGMENTS.reduce((sum, segment) => sum + data[segment.key], 0) : 0

  return (
    <SectionCard
      icon={<FolderCheck className="h-4 w-4" />}
      title="Document compliance"
      subtitle={total > 0 ? `${total} documents` : undefined}
    >
      {isLoading && <WidgetSkeleton rows={2} />}

      {!isLoading && !data && <WidgetPendingBackend label="Document compliance" />}

      {/* La sección llegó pero sin nada que medir: no hay configuraciones
          documentales activas. Distinto de "no llegó", y distinto de "todo en
          orden" — por eso va en tono neutro. */}
      {!isLoading && data && total === 0 && (
        <WidgetEmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="No documents to track"
          description="There are no active document requirements for this scope yet."
          tone="neutral"
        />
      )}

      {!isLoading && data && total > 0 && (
        <>
          <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
            {SEGMENTS.map((segment) => {
              const value = data[segment.key]
              if (value === 0) return null
              return (
                <div
                  key={segment.key}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(value / total) * 100}%`, backgroundColor: segment.color }}
                  title={`${segment.label}: ${value}`}
                />
              )
            })}
          </div>

          {/* Leyenda con etiqueta directa: la identidad nunca queda sólo en el color */}
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {SEGMENTS.map((segment) => {
              const value = data[segment.key]
              const percent = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <li key={segment.key} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: segment.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{segment.label}</span>
                  <span className="text-xs font-semibold tabular-nums text-slate-900">{value}</span>
                  <span className="w-9 text-right text-[11px] tabular-nums text-slate-400">{percent}%</span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </SectionCard>
  )
}
