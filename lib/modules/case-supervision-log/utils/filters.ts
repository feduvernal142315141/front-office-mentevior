import { FilterOperator } from "@/lib/models/filterOperator"
import type { FilterRule } from "@/lib/utils/query-filters"
import type { ReportMonth } from "@/lib/utils/report-month"
import { toMonthYearParam } from "./month-year"

/**
 * Los filtros del listado, en un solo lugar.
 *
 * ✅ **Rangos de mes.** Backend confirmó el 2026-08-08 que transforma `MMyyyy` a
 * fecha antes de comparar, así que `GTE`/`LTE` funcionan aunque el valor crudo
 * no sea ordenable (enero de 2027 es `012027`, menor que `082026` como número).
 * Sin esa transformación, un rango que cruza el cambio de año devolvería de
 * menos y en silencio.
 *
 * 🟡 **Prefijo de tipo.** Sigue sin confirmarse (§7 de
 * `docs/case-supervision-log-backend.md`). Se manda `monthYear` como String
 * pelado —así está el ejemplo del contrato— y los ids con `UUID_`, como en
 * Monthly Supervision. Un prefijo de más o de menos no da error: la lista
 * vuelve vacía.
 *
 * Todo centralizado acá para que ajustarlo no toque ni la tabla ni los hooks.
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

/** Un mes exacto */
export function monthEqualsFilter(reportMonth: ReportMonth): FilterRule {
  return {
    field: "monthYear",
    operator: FilterOperator.eq,
    value: toMonthYearParam(reportMonth),
    type: "string",
    logic: "AND",
  }
}

/** Desde este mes, inclusive */
export function monthFromFilter(reportMonth: ReportMonth): FilterRule {
  return {
    field: "monthYear",
    operator: FilterOperator.greaterEqual,
    value: toMonthYearParam(reportMonth),
    type: "string",
    logic: "AND",
  }
}

/** Hasta este mes, inclusive */
export function monthToFilter(reportMonth: ReportMonth): FilterRule {
  return {
    field: "monthYear",
    operator: FilterOperator.lessEqual,
    value: toMonthYearParam(reportMonth),
    type: "string",
    logic: "AND",
  }
}

/** Orden por defecto del listado: lo más reciente primero */
export const DEFAULT_ORDERS = ["monthYear__DESC"]
