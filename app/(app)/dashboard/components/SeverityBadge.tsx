import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react"
import type { Severity } from "@/lib/types/dashboard.types"
import { SEVERITY_STYLES } from "./tokens"
import { cn } from "@/lib/utils"

const SEVERITY_ICON: Record<Severity, React.ElementType> = {
  critical: ShieldAlert,
  serious: AlertTriangle,
  warning: Clock,
  good: CheckCircle2,
}

interface SeverityBadgeProps {
  severity: Severity
  /** Texto propio; por defecto la etiqueta del estado */
  label?: string
  className?: string
}

/**
 * Estado con **icono + etiqueta**, nunca color solo: es la señal secundaria que
 * exige la accesibilidad y lo que hace que el badge siga leyéndose en daltonismo,
 * escala de grises o `forced-colors`.
 */
export function SeverityBadge({ severity, label, className }: SeverityBadgeProps) {
  const styles = SEVERITY_STYLES[severity]
  const Icon = SEVERITY_ICON[severity]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-semibold",
        styles.badge,
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label ?? styles.label}
    </span>
  )
}
