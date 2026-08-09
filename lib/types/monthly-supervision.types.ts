/**
 * Monthly Supervision — contrato del módulo.
 *
 * Fuentes:
 * - "Monthly Supervision API Contract" (2026-08-04) — POST/PUT, appointments, PDF
 * - "Endpoints de catálogos de Monthly Supervision" (2026-08-05) — catálogos,
 *   listado y delete
 * - `docs/monthly-supervision-backend.md` — lo que falta y por qué
 *
 * Ojo con el vocabulario: **`providerId` es el supervisee**, la persona
 * supervisada. El supervisor es el usuario logueado y el backend lo resuelve del
 * token — por eso no viaja en el DTO.
 */

/** Período del reporte en el formato que guarda y filtra el backend: `yyyyMM` */
import type { ReportMonth } from "@/lib/utils/report-month"
export type { ReportMonth }

// ============================================
// Catálogos
// ============================================

export interface SupervisionOptionCatalogItem {
  id: string
  /** Código estable: es lo único a lo que el front se puede anclar */
  code: string
  name: string
  sortOrder: number
}

/** `code` de la opción que habilita el texto libre `otherAppliedOption` */
export const OTHER_APPLIED_OPTION_CODE = "OTHER"

// ============================================
// Listado
// ============================================

export interface MonthlySupervisionListItem {
  id: string
  clientId: string
  clientName: string
  providerId: string
  /** Nombre del supervisee */
  providerName: string
  /** `yyyyMM`, ej. `"202608"` */
  requestedReportDate: string
  totalHoursWorked?: number
  supervisedHours?: number
  createAt?: string
  active?: boolean
}

// ============================================
// Appointments del reporte
// ============================================

export interface SupervisionAppointment {
  /** `Appointment.id` — el listado lo llama `id` y el POST `appointmentId` */
  appointmentId: string
  date: string
  /** El contrato lo manda como string, sin unidad declarada */
  duration: string
  /**
   * `AppointmentNote97155Detail.activeDirectionNarrative`.
   * **Sólo lectura**: se muestra, no se edita (decisión del 2026-08-05).
   */
  summary: string
  mode?: string
  structure?: string
  evaluation?: string
}

/**
 * Qué campos trajo realmente el backend al cargar un reporte existente.
 *
 * No es paranoia: el `PUT` **reemplaza** appointments y opciones, así que
 * guardar sin haber podido precargarlos borra lo que había. Esta bandera es lo
 * que permite bloquear el guardado en vez de destruir datos en silencio.
 * Ver R3 en `docs/monthly-supervision-backend.md`.
 */
export interface DetailCompleteness {
  /** Vinieron `documentOptionCatalogIds` y `appliedOptionCatalogIds` */
  options: boolean
  /** Los appointments traen `mode` / `structure` / `evaluation` */
  evaluations: boolean
  /** Vinieron `clientId` y `providerId`, que el `PUT` exige de vuelta */
  identifiers: boolean
}

/**
 * Respuesta de los dos endpoints de appointments:
 * - `GET /reports/monthly-supervision/appointments?clientId&providerId&monthYear`
 *   (arma un reporte nuevo)
 * - `GET /reports/monthly-supervision/{id}/appointments`
 *   (carga uno ya guardado)
 */
export interface MonthlySupervisionContext {
  clientId?: string
  clientName: string
  providerId?: string
  supervisor: { name: string; credentials?: string }
  supervisee: { name: string }
  totalHoursWorked: number
  supervisedHours: number
  /** Data URL (`data:image/png;base64,...`) o `null` */
  supervisorSign?: string | null
  superviseeSign?: string | null
  requestedReportDate?: ReportMonth
  otherAppliedOption?: string
  /** `undefined` = el backend no mandó la clave · `[]` = vino vacía */
  documentOptionCatalogIds?: string[]
  appliedOptionCatalogIds?: string[]
  appointments: SupervisionAppointment[]
  completeness: DetailCompleteness
}

// ============================================
// Guardado
// ============================================

export interface SaveMonthlySupervisionAppointment {
  appointmentId: string
  mode: string
  structure: string
  evaluation: string
}

export interface SaveMonthlySupervisionDto {
  clientId: string
  /** El supervisee */
  providerId: string
  /** Formato controlado por `report-month.ts` — ver la ambigüedad de §7.0 */
  requestedReportDate: string
  otherAppliedOption: string
  totalHoursWorked: number
  supervisedHours: number
  supervisorSign: string
  superviseeSign: string
  documentOptionCatalogIds: string[]
  appliedOptionCatalogIds: string[]
  appointments: SaveMonthlySupervisionAppointment[]
}
