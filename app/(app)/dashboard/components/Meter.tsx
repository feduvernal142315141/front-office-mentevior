import type { Severity } from "@/lib/types/dashboard.types"
import { STATUS_COLOR } from "./tokens"
import { cn } from "@/lib/utils"

interface MeterProps {
  /** 0..100 */
  percent: number
  severity: Severity
  className?: string
  /** Barra más gruesa para cuando es el protagonista de la tarjeta */
  size?: "sm" | "md"
}

/**
 * Medidor de un ratio contra un límite.
 *
 * El relleno lleva la severidad y la pista es un paso más claro **del mismo
 * color**, no un gris genérico: así el estado se lee a lo largo de toda la barra
 * y no sólo en el tramo lleno.
 */
export function Meter({ percent, severity, className, size = "sm" }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const color = STATUS_COLOR[severity]

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full",
        size === "sm" ? "h-1.5" : "h-2.5",
        className,
      )}
      style={{ backgroundColor: `${color}1F` }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  )
}
