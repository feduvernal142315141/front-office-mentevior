import type { Severity } from "@/lib/types/dashboard.types"

/**
 * Tokens de color del dashboard.
 *
 * La paleta categórica está anclada a nuestro azul de marca en el slot 1 y fue
 * verificada con el validador, no elegida a ojo:
 *   CVD peor par adyacente ΔE 9.1 (objetivo ≥8) · visión normal ΔE 19.6 (piso ≥15)
 *   Advertencia de contraste en 3 slots → obligan etiqueta directa visible.
 *
 * Los tokens de ESTADO son reservados: nunca se reciclan como color de serie, y
 * siempre viajan con icono + etiqueta, jamás color solo. El rojo queda
 * exclusivamente para lo crítico.
 *
 * Ver `plans/dashboard.md` §7.2.
 */

export const BRAND = {
  primary: "#037ECC",
  secondary: "#079CFB",
  /** Gris de de-énfasis para las series de contexto */
  muted: "#94A3B8",
  grid: "hsl(240 20% 93%)",
} as const

/** Paleta categórica validada. Se asigna en orden fijo, nunca ciclada. */
export const CATEGORICAL = [
  "#037ECC", "#eb6834", "#1baf7a", "#eda100",
  "#e87ba4", "#008300", "#4a3aa7", "#e34948",
] as const

export const STATUS_COLOR: Record<Severity, string> = {
  critical: "#d03b3b",
  serious: "#ec835a",
  warning: "#fab219",
  good: "#0ca30c",
}

/** Clases de superficie para badges y fondos suaves por severidad */
export const SEVERITY_STYLES: Record<Severity, { badge: string; dot: string; row: string; label: string }> = {
  critical: {
    badge: "bg-red-50 border-red-200 text-red-700",
    dot: "bg-[#d03b3b]",
    row: "border-l-[#d03b3b] bg-red-50/40",
    label: "Critical",
  },
  serious: {
    badge: "bg-orange-50 border-orange-200 text-orange-700",
    dot: "bg-[#ec835a]",
    row: "border-l-[#ec835a] bg-orange-50/30",
    label: "Urgent",
  },
  warning: {
    badge: "bg-amber-50 border-amber-200 text-amber-700",
    dot: "bg-[#fab219]",
    row: "border-l-[#fab219] bg-amber-50/25",
    label: "Upcoming",
  },
  good: {
    badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    dot: "bg-[#0ca30c]",
    row: "border-l-[#0ca30c] bg-emerald-50/25",
    label: "On track",
  },
}
