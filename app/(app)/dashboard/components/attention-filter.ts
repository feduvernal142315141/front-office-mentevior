import type { ExpiringItem, ExpiringKind } from "@/lib/types/dashboard.types"

/**
 * Filtro compartido entre el hero (W1) y la lista (W3).
 *
 * Los chips del hero NO navegan a otro módulo a propósito: llevarte a `/users`
 * te deja en una tabla sin filtrar por vencimiento y tenés que volver a buscar
 * cuáles eran. La respuesta ya está en la lista de abajo — el chip la enfoca, y
 * cada fila sí navega al lugar exacto.
 */
export type AttentionFilter =
  | { type: "all" }
  | { type: "critical" }
  | { type: "kind"; kind: ExpiringKind }

export const ALL_FILTER: AttentionFilter = { type: "all" }

export function isSameFilter(a: AttentionFilter, b: AttentionFilter): boolean {
  if (a.type !== b.type) return false
  if (a.type === "kind" && b.type === "kind") return a.kind === b.kind
  return true
}

export function matchesFilter(item: ExpiringItem, filter: AttentionFilter): boolean {
  switch (filter.type) {
    case "critical":
      return item.severity === "critical"
    case "kind":
      return item.kind === filter.kind
    default:
      return true
  }
}
