import { ReferenceLine } from "recharts"

import {
  DEFAULT_ENVIRONMENTAL_CHANGES,
  environmentalChangeLabel,
} from "@/lib/constants/environmental-changes"
import type { EnvironmentalChangesDisplay } from "@/lib/types/data-collection.types"

export interface EnvChangeEntry {
  dateLabel: string
  note: string
}

export interface EnvChangeMarker extends EnvChangeEntry {
  /** La etiqueta corta que se pinta en modo `LABEL` */
  label: string
}

/**
 * Numera los cambios en el orden en que aparecen en la gráfica, que ya viene
 * ordenado por fecha. El número es lo que une la etiqueta de arriba con su
 * explicación en el listado de abajo.
 */
export function buildEnvChangeMarkers(entries: EnvChangeEntry[]): EnvChangeMarker[] {
  return entries.map((entry, index) => ({ ...entry, label: environmentalChangeLabel(index) }))
}

const ENV_CHANGE_COLOR = "#14B8A6"

/**
 * Las líneas (o etiquetas) de environmental change dentro del área de la gráfica.
 *
 * Devuelve un array de `ReferenceLine` en vez de un componente porque Recharts
 * sólo reconoce a sus hijos directos: envolverlos haría que no se dibujen.
 */
export function renderEnvChangeMarkers({
  markers,
  display,
  resolveX,
}: {
  markers: EnvChangeMarker[]
  display: EnvironmentalChangesDisplay
  /**
   * Unas gráficas usan eje numérico y otras categórico, así que la posición la
   * resuelve quien llama: acá sólo se decide qué se dibuja, no dónde.
   */
  resolveX: (dateLabel: string) => string | number | undefined
}) {
  if (display.displayMode === "LIST_ONLY") return null

  return markers.map((marker) => {
    const x = resolveX(marker.dateLabel)
    if (x === undefined) return null

    return (
      <ReferenceLine
        key={`env-${marker.dateLabel}`}
        x={x}
        stroke={ENV_CHANGE_COLOR}
        strokeWidth={1}
        strokeDasharray="4 3"
        label={
          display.displayMode === "LABEL"
            ? ({ viewBox }: { viewBox: { x?: number; y?: number } }) => {
                const cx = viewBox?.x ?? 0
                const y = (viewBox?.y ?? 0) + 6
                const width = Math.max(26, marker.label.length * 7 + 10)
                return (
                  <g>
                    <rect
                      x={cx - width / 2}
                      y={y - 14}
                      width={width}
                      height={18}
                      rx={9}
                      fill={ENV_CHANGE_COLOR}
                    />
                    <text
                      x={cx}
                      y={y - 1}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {marker.label}
                    </text>
                  </g>
                )
              }
            : undefined
        }
      />
    )
  })
}

/** El chip de la leyenda de arriba. En `LIST_ONLY` no hay nada que explicar. */
export function shouldShowEnvChangeLegendChip(
  markers: EnvChangeMarker[],
  display: EnvironmentalChangesDisplay,
): boolean {
  return markers.length > 0 && display.displayMode !== "LIST_ONLY"
}

/**
 * `LIST_ONLY` no dibuja nada en la gráfica, así que apagar también el listado
 * dejaría los cambios sin ninguna representación. En ese caso se muestra igual:
 * el proveedor eligió "sólo la lista", no "nada".
 */
export function shouldShowEnvChangeLegendBelow(
  display: EnvironmentalChangesDisplay = DEFAULT_ENVIRONMENTAL_CHANGES,
): boolean {
  return display.showLegendBelow || display.displayMode === "LIST_ONLY"
}
