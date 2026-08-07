import { Gauge, ShieldCheck } from "lucide-react"
import type { AuthorizationUtilizationItem } from "@/lib/types/dashboard.types"
import { UTILIZATION_THRESHOLDS } from "@/lib/modules/dashboard/utils/severity"
import { SectionCard } from "@/components/custom/SectionCard"
import { InfoTooltip } from "@/components/custom/InfoTooltip"
import { Meter } from "./Meter"
import { RowChevron, RowLink } from "./RowLink"
import { WidgetEmptyState, WidgetPendingBackend, WidgetSkeleton } from "./WidgetStates"
import { cn } from "@/lib/utils"

interface AuthorizationUtilizationProps {
  data?: { items: AuthorizationUtilizationItem[] }
  isLoading?: boolean
}

/**
 * W4 — Utilización de autorizaciones.
 *
 * El riesgo de la sobre-utilización: si se consumen las unidades o se vence la
 * autorización, las sesiones ya dadas no se cobran. Es de las señales de mayor
 * impacto económico del dashboard y hoy nadie la ve hasta que rebota el claim.
 *
 * Es un ratio contra un límite, así que va como medidor y no como gráfica.
 */
/** El backend manda 4 decimales (`480.0000`); en pantalla sobran. */
function formatUnits(units: number): string {
  return units.toLocaleString("en-US", { maximumFractionDigits: 2 })
}

export function AuthorizationUtilization({ data, isLoading }: AuthorizationUtilizationProps) {
  // La lista es el top por consumo, no una lista de riesgo: puede traer
  // autorizaciones sanas. Contar todo como "at risk" sería una falsa alarma.
  const atRisk = data?.items.filter((item) => item.severity !== "good").length ?? 0
  const subtitle = data?.items.length
    ? atRisk > 0
      ? `${atRisk} at risk`
      : `Top ${data.items.length} by usage`
    : undefined

  return (
    <SectionCard
      icon={<Gauge className="h-4 w-4" />}
      title="Authorization usage"
      subtitle={subtitle}
      action={
        <InfoTooltip
          message={`Flagged when used units reach ${UTILIZATION_THRESHOLDS.warning}% of what was authorized.`}
        />
      }
    >
      {isLoading && <WidgetSkeleton rows={4} />}

      {!isLoading && !data && <WidgetPendingBackend label="Authorization usage" />}

      {!isLoading && data && data.items.length === 0 && (
        <WidgetEmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="No authorizations at risk"
          description="Every active authorization is under the alert threshold."
        />
      )}

      {!isLoading && data && data.items.length > 0 && (
        <ul className="space-y-4">
          {data.items.map((item) => (
            <li key={item.id}>
              {/* El medidor va DENTRO del enlace: la barra es la mitad del dato,
                  dejarla fuera partiría el área de click justo por el medio. */}
              <RowLink
                href={item.href}
                className={cn(
                  "-mx-2 block rounded-xl px-2 py-2 transition-colors",
                  item.href && "hover:bg-slate-50",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.clientName}</p>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-600">{item.billingCode}</span>
                      {" · "}
                      {/* Columna de números: acá sí corresponde tabular-nums */}
                      <span className="tabular-nums">
                        {formatUnits(item.unitsUsed)} / {formatUnits(item.unitsAuthorized)} units
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-1.5">
                    {/* Etiqueta directa: es la señal secundaria que el color por sí solo no da */}
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {item.percentUsed}%
                    </span>
                    {item.href && <RowChevron className="self-center" />}
                  </div>
                </div>
                <Meter percent={item.percentUsed} severity={item.severity} className="mt-2" />
              </RowLink>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
