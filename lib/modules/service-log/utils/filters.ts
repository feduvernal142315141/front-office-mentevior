import { FilterOperator } from "@/lib/models/filterOperator"
import type { FilterRule } from "@/lib/utils/query-filters"

/**
 * Los filtros del listado de Service Logs, en un solo lugar.
 *
 * El contrato (2026-08-10) trae ejemplos con prefijo tipado — `UUID_` para ids
 * y `Date_yyyy-MM-dd` para fechas — que es exactamente lo que produce
 * `buildFilters` con `type: "uuid"` / `type: "date"`.
 *
 * Semántica del rango (según el ejemplo del contrato): `initDate >= from` y
 * `endDate <= to`, o sea logs **contenidos** en el rango filtrado.
 */

export function clientFilter(clientId: string): FilterRule {
  return {
    field: "clientId",
    operator: FilterOperator.eq,
    value: clientId,
    type: "uuid",
    logic: "AND",
  }
}

export function providerFilter(providerId: string): FilterRule {
  return {
    field: "providerId",
    operator: FilterOperator.eq,
    value: providerId,
    type: "uuid",
    logic: "AND",
  }
}

/** Logs cuyo período empieza en o después de esta fecha (`yyyy-MM-dd`) */
export function initDateFromFilter(date: string): FilterRule {
  return {
    field: "initDate",
    operator: FilterOperator.greaterEqual,
    value: date,
    type: "date",
    logic: "AND",
  }
}

/** Logs cuyo período termina en o antes de esta fecha (`yyyy-MM-dd`) */
export function endDateToFilter(date: string): FilterRule {
  return {
    field: "endDate",
    operator: FilterOperator.lessEqual,
    value: date,
    type: "date",
    logic: "AND",
  }
}

/** Orden por defecto: período más reciente primero (el backend agrega `createAt DESC`) */
export const DEFAULT_ORDERS = ["initDate__DESC"]
