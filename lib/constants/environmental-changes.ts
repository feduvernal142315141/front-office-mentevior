import type {
  EnvironmentalChangesDisplay,
  EnvironmentalChangesDisplayMode,
} from "@/lib/types/data-collection.types"

/**
 * Lo que el backend asigna a los registros nuevos y a los que ya existían
 * (contrato 2026-09-07). Es también el comportamiento histórico del front, así
 * que un item sin configurar se sigue viendo exactamente igual que antes.
 */
export const DEFAULT_ENVIRONMENTAL_CHANGES: EnvironmentalChangesDisplay = {
  displayMode: "LINE",
  showLegendBelow: true,
}

export const ENVIRONMENTAL_CHANGES_DISPLAY_MODES: readonly EnvironmentalChangesDisplayMode[] = [
  "LINE",
  "LIST_ONLY",
  "LABEL",
]

export const ENVIRONMENTAL_CHANGES_DISPLAY_OPTIONS = [
  { value: "LINE", label: "Phase line on the chart" },
  { value: "LIST_ONLY", label: "List below only" },
  { value: "LABEL", label: "Label on the chart" },
] satisfies Array<{ value: EnvironmentalChangesDisplayMode; label: string }>

export function parseEnvironmentalChangesDisplayMode(
  value: unknown,
): EnvironmentalChangesDisplayMode {
  const mode = ENVIRONMENTAL_CHANGES_DISPLAY_MODES.find((option) => option === value)
  return mode ?? DEFAULT_ENVIRONMENTAL_CHANGES.displayMode
}

/**
 * Un item guardado antes del contrato no trae el bloque; se lee como el default
 * para que la gráfica no cambie sola.
 */
export function parseEnvironmentalChanges(value: unknown): EnvironmentalChangesDisplay {
  const raw = (value ?? {}) as Record<string, unknown>
  return {
    displayMode: parseEnvironmentalChangesDisplayMode(raw.displayMode),
    showLegendBelow:
      typeof raw.showLegendBelow === "boolean"
        ? raw.showLegendBelow
        : DEFAULT_ENVIRONMENTAL_CHANGES.showLegendBelow,
  }
}

/**
 * La etiqueta corta que se pinta sobre la gráfica en modo `LABEL`.
 *
 * El contrato **no** trae una etiqueta por cambio —lo pedido en B1 era un
 * `environmentalChangesLabel` junto a cada nota, que no llegó— así que se numeran
 * en orden de fecha y el listado de abajo explica cada número. En cuanto backend
 * entregue el campo, esto pasa a devolver el texto que escribió el proveedor.
 */
export function environmentalChangeLabel(index: number): string {
  return `EC${index + 1}`
}
