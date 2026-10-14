/**
 * Case Supervision Log — contrato del módulo.
 *
 * Fuente: "Case Supervision Log - API Contract" (2026-08-07).
 * Preguntas abiertas y supuestos: `docs/case-supervision-log-backend.md`.
 *
 * Dos cosas que lo separan de Monthly Supervision y conviene tener presentes al
 * leer estos tipos:
 *
 * 1. **No hay `DELETE`, y el `PUT` sólo toca las entradas manuales.** El
 *    encabezado y los appointments quedan como se crearon.
 * 2. **Lo único que aporta el usuario son las entradas manuales**
 *    (`withoutAppointments`, contrato 2026-10-12). El trío (cliente, provider,
 *    mes) lo elige, y el resto lo calcula y persiste el backend.
 */

import type { ReportMonth } from "@/lib/utils/report-month"

export type { ReportMonth }

/** Mínimo de supervisión sobre el total de horas para dar el requisito por cumplido */
export const SUPERVISION_COMPLIANCE_THRESHOLD = 10

// ============================================
// Fila de appointment
// ============================================

/**
 * Una sesión del período. La misma forma la devuelven el endpoint de preparación
 * y el detalle persistido; la diferencia es que el persistido trae `id`.
 */
export interface CaseSupervisionAppointment {
  /** Sólo en el reporte persistido. Al preparar todavía no existe la fila */
  id?: string
  /** ISO `yyyy-MM-dd` */
  date: string
  /** `HH:mm:ss` */
  timeStart: string
  /** `HH:mm:ss` */
  timeEnd: string
  /** Horas con dos decimales, calculadas por el backend */
  duration: number
  /**
   * `BillingCode.description`. **Puede traer saltos de línea reales**: cuando el
   * appointment tiene subevents se le agrega `"\nRBT Supervision"`, así que hay
   * que renderizarlo respetando el `\n` o las dos etiquetas quedan pegadas.
   */
  characteristic: string
  /** `DIRECT` / `INDIRECT`. Vacío en reportes anteriores al contrato 2026-10-14 */
  serviceType: string
  /** Snapshot, p. ej. `"CPT 97153 (XP)"` */
  billingCode: string
  /** Sólo el nombre; el appointment no trae el id de la modalidad */
  modalityName: string
  /** Nombres de los participantes */
  participants: string[]
}

// ============================================
// Manual Log Entry — `withoutAppointments`
// ============================================

/**
 * El backend deriva `serviceType` del billing code: 97153 es directo, cualquier
 * otro es indirecto. Se replica acá para mostrarlo antes de guardar y para
 * mandarlo en el `PUT`, que sí lo acepta.
 */
export function getServiceTypeForBillingCode(code: string | undefined): string {
  if (!code) return ""
  return /\b97153\b/.test(code) ? "DIRECT" : "INDIRECT"
}

export interface ActivityCategoryCatalogItem {
  id: string
  code: string
  name: string
  sortOrder: number
}

export interface CaseSupervisionManualParticipant {
  id: string
  catalogId: string
  catalogName: string
}

/**
 * Una actividad cargada a mano, sin appointment detrás. Existen para sumar
 * tareas cuando el provider no llega al 10% de supervisión.
 *
 * Los textos (`billingCode`, `clientAddressPlaceServiceName`, `modalityName`)
 * son snapshots que genera el backend al guardar; los ids son los que se usan
 * para precargar los selects y reenviar en el `PUT`.
 */
export interface CaseSupervisionManualEntry {
  id: string
  /** ISO `yyyy-MM-dd`, o vacío: ningún campo es obligatorio */
  date: string
  /** `HH:mm:ss` */
  timeStart: string
  /** `HH:mm:ss` */
  timeEnd: string
  duration: number
  /** Description of Activity */
  description: string
  /** `DIRECT` / `INDIRECT`, calculado por el backend desde el billing code */
  serviceType: string
  /** Snapshot, p. ej. `"CPT 97155 (XP)"`. Vacío cuando no se eligió billing code */
  billingCode: string
  billingCodeId: string
  clientAddressId: string
  clientAddressPlaceServiceName: string
  modalityCatalogId: string
  modalityName: string
  activityCategories: { id: string; name: string }[]
  participants: CaseSupervisionManualParticipant[]
}

/**
 * Una entrada manual tal como viaja en el `POST` y en el `PUT` (éste con `id`).
 * `serviceType` sólo va en el `PUT`: al crear lo calcula el backend.
 */
export interface CaseSupervisionManualEntryInput {
  id?: string
  activityCategoryIds: string[]
  billingCodeId: string | null
  clientAddressId: string | null
  modalityCatalogId: string | null
  participantIds: string[]
  serviceType?: string | null
  date: string | null
  timeStart: string | null
  timeEnd: string | null
  duration: number
  description: string | null
}

export interface UpdateCaseSupervisionLogDto {
  withoutAppointments: CaseSupervisionManualEntryInput[]
}

// ============================================
// Preparación — GET /appointments
// ============================================

export interface CaseSupervisionPreparation {
  /** Todas las horas del cliente en el mes, sin filtrar por provider */
  totalsHours: number
  /** Horas de los appointments cuyo provider es el seleccionado */
  supervisionHours: number
  appointments: CaseSupervisionAppointment[]
}

// ============================================
// Listado
// ============================================

export interface CaseSupervisionLogListItem {
  id: string
  clientId: string
  clientName: string
  providerId: string
  providerName: string
  /** El backend lo manda como `MMyyyy`; acá ya viene normalizado a `yyyyMM` */
  monthYear: ReportMonth
  /**
   * El listado **no los devuelve** — confirmado por backend el 2026-08-08, no es
   * un olvido del contrato. Por eso la tabla no tiene columnas de horas ni de
   * cumplimiento: mostrarían un guion en todas las filas.
   *
   * Se dejan tipados y opcionales porque el servicio ya los lee si aparecen: si
   * backend los agrega, sólo hay que volver a poner las columnas.
   */
  totalsHours?: number
  supervisionHours?: number
}

// ============================================
// Detalle
// ============================================

export interface CaseSupervisionLogDetail {
  id: string
  clientId: string
  clientName: string
  providerId: string
  providerName: string
  /** ISO `yyyy-MM-dd` — el día concreto con el que se creó el reporte */
  date: string
  /** Normalizado a `yyyyMM` */
  monthYear: ReportMonth
  totalsHours: number
  supervisionHours: number
  appointments: CaseSupervisionAppointment[]
  withoutAppointments: CaseSupervisionManualEntry[]
}

// ============================================
// Alta
// ============================================

/**
 * Lo que viaja al crear: la identidad y las entradas manuales. El backend vuelve
 * a consultar los appointments y recalcula horas, duraciones y características:
 * mandar totales desde el front sería mandar datos que el servidor va a ignorar.
 */
export interface CreateCaseSupervisionLogDto {
  clientId: string
  providerId: string
  /** ISO `yyyy-MM-dd`. El backend deriva el mes y el año de acá */
  date: string
  withoutAppointments?: CaseSupervisionManualEntryInput[]
}

// ============================================
// Cumplimiento
// ============================================

export interface SupervisionCompliance {
  /** 0..100, o `null` cuando no hay horas totales y el porcentaje no existe */
  percent: number | null
  /** `null` cuando no se puede determinar */
  isMet: boolean | null
}

/**
 * Porcentaje de supervisión y si cumple el mínimo.
 *
 * Misma fórmula que usa el PDF (`supervisionHours * 100 / totalsHours`), para
 * que la pantalla y el documento no puedan decir cosas distintas.
 *
 * Con `totalsHours` en 0 el porcentaje **no es 0%, es indefinido**: no hubo
 * actividad que medir. Devolver `0` haría que un mes sin sesiones se mostrara
 * como incumplimiento, que es una acusación falsa.
 */
export function getSupervisionCompliance(
  supervisionHours: number | undefined,
  totalsHours: number | undefined,
): SupervisionCompliance {
  if (
    typeof supervisionHours !== "number" ||
    typeof totalsHours !== "number" ||
    !Number.isFinite(totalsHours) ||
    totalsHours <= 0
  ) {
    return { percent: null, isMet: null }
  }

  const percent = (supervisionHours * 100) / totalsHours
  return { percent, isMet: percent >= SUPERVISION_COMPLIANCE_THRESHOLD }
}
