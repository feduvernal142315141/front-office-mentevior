"use client"

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react"
import {
  SUPERVISION_COMPLIANCE_THRESHOLD,
  getSupervisionCompliance,
} from "@/lib/types/case-supervision-log.types"
import { cn } from "@/lib/utils"

interface ComplianceSummaryProps {
  totalsHours: number
  supervisionHours: number
}

function formatHours(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * El resultado del reporte: horas, porcentaje y si cumple el mínimo.
 *
 * Es la información que decide si el reporte sirve, y hasta ahora sólo existía
 * dentro del PDF. Mostrarla antes de crear le da al analista la oportunidad de
 * revisar el período elegido en vez de descubrir el problema en un documento ya
 * emitido —que no se puede editar ni borrar—.
 *
 * Usa la misma fórmula que el PDF para que pantalla y documento no puedan decir
 * cosas distintas.
 */
export function ComplianceSummary({ totalsHours, supervisionHours }: ComplianceSummaryProps) {
  const { percent, isMet } = getSupervisionCompliance(supervisionHours, totalsHours)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat label="Total hours" value={formatHours(totalsHours)} />
      <Stat label="Supervision hours" value={formatHours(supervisionHours)} />

      <div
        className={cn(
          "rounded-2xl border px-5 py-4",
          isMet === null && "border-slate-200 bg-slate-50/60",
          isMet === true && "border-emerald-200 bg-emerald-50/60",
          isMet === false && "border-red-200 bg-red-50/60",
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Supervision
        </span>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold leading-none tabular-nums text-slate-900">
            {percent === null ? "—" : `${percent.toFixed(1)}%`}
          </span>
          <ComplianceBadge isMet={isMet} />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          {percent === null
            ? "No hours logged for this client in the selected month."
            : `Requirement is at least ${SUPERVISION_COMPLIANCE_THRESHOLD}%.`}
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <p className="mt-2 text-3xl font-semibold leading-none tabular-nums text-slate-900">{value}</p>
    </div>
  )
}

/**
 * Met / Unmet con etiqueta y forma propias, no sólo color: el resultado del
 * reporte no puede depender de distinguir verde de rojo.
 */
export function ComplianceBadge({ isMet }: { isMet: boolean | null }) {
  if (isMet === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        <CircleDashed className="h-3 w-3" aria-hidden />
        Not applicable
      </span>
    )
  }

  return isMet ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Met
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-red-700">
      <XCircle className="h-3 w-3" aria-hidden />
      Unmet
    </span>
  )
}
