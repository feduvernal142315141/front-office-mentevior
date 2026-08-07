import { CalendarCheck, FileSignature, Hospital, TrendingUp } from "lucide-react"
import type { DashboardKpis } from "@/lib/types/dashboard.types"
import { severityFromCoverage, severityFromPercentUsed } from "@/lib/modules/dashboard/utils/severity"
import type { KpiHrefs } from "../hooks/useDashboardLayout"
import { StatTile } from "./StatTile"

interface KpiRowProps {
  kpis?: DashboardKpis
  isLoading?: boolean
  /** El RBT ve una fila reducida: la utilización de autorizaciones no es su trabajo */
  compact?: boolean
  /** Destino de cada tile, ya filtrado por permisos */
  hrefs?: KpiHrefs
}

/** W2 — Fila de KPIs. Números de cabecera, no gráficas. */
export function KpiRow({ kpis, isLoading, compact = false, hrefs }: KpiRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: compact ? 2 : 4 }).map((_, index) => (
          <div key={index} className="h-[132px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  const usage = kpis?.authorizationUsage
  const clinicalMonthly = kpis?.clinicalMonthlyThisMonth

  // Llega como conteo pelado: se envuelve para que el tile lo pinte igual que
  // los demás, sin delta ni sparkline porque el backend ya no manda serie.
  const notesPending = kpis?.notesPendingSignature

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-4"}`}>
      <StatTile
        label="Sessions this week"
        kpi={kpis?.sessionsThisWeek}
        icon={<CalendarCheck className="h-4 w-4" />}
        href={hrefs?.sessionsThisWeek}
      />
      <StatTile
        label="Notes pending signature"
        kpi={typeof notesPending === "number" ? { value: notesPending, higherIsBetter: false } : undefined}
        icon={<FileSignature className="h-4 w-4" />}
        href={hrefs?.notesPendingSignature}
      />

      {!compact && (
        <>
          <StatTile
            label="Authorization units used"
            kpi={usage}
            icon={<TrendingUp className="h-4 w-4" />}
            meterSeverity={usage ? severityFromPercentUsed(usage.value) : undefined}
          />
          <StatTile
            label="Clinical Monthly"
            kpi={clinicalMonthly}
            icon={<Hospital className="h-4 w-4" />}
            // Cobertura: acá llegar al tope es lo bueno, así que la severidad se
            // calcula al revés que en las autorizaciones.
            meterSeverity={
              clinicalMonthly?.target
                ? severityFromCoverage(clinicalMonthly.value, clinicalMonthly.target)
                : undefined
            }
            footnote={
              clinicalMonthly?.target
                ? `${clinicalMonthly.value} of ${clinicalMonthly.target} clients covered this month`
                : undefined
            }
            href={hrefs?.clinicalMonthlyThisMonth}
          />
        </>
      )}
    </div>
  )
}
