/**
 * Case Supervision Log — contrato del módulo.
 *
 * Fuente: "Case Supervision Log - API Contract" (2026-08-07).
 * Preguntas abiertas y supuestos: `docs/case-supervision-log-backend.md`.
 *
 * Dos cosas que lo separan de Monthly Supervision y conviene tener presentes al
 * leer estos tipos:
 *
 * 1. **No hay `PUT` ni `DELETE`.** El reporte se crea y queda. Por eso no existe
 *    un `SaveDto` con todos los campos: el `POST` sólo lleva la identidad.
 * 2. **El usuario no aporta ningún dato del contenido.** Elige el trío
 *    (cliente, provider, mes) y el backend calcula y persiste todo lo demás.
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
}

// ============================================
// Alta
// ============================================

/**
 * Lo único que viaja al crear. El backend vuelve a consultar los appointments y
 * recalcula horas, duraciones y características: mandar totales desde el front
 * sería mandar datos que el servidor va a ignorar.
 */
export interface CreateCaseSupervisionLogDto {
  clientId: string
  providerId: string
  /** ISO `yyyy-MM-dd`. El backend deriva el mes y el año de acá */
  date: string
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
