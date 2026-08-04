/**
 * Clinical Monthly (SCRUM-163)
 *
 * Reporte mensual clínico que crea el analista para un cliente y un rango de
 * meses. Los RBT sólo lo visualizan.
 *
 * Contrato backend al 2026-08-02. Todavía faltan campos que la HU pide
 * (`providerId`/`providerName` y `status` en el listado); están marcados como
 * opcionales para que la UI se pueda construir completa y se active sola en
 * cuanto el backend los mande. Ver `plans/SCRUM-163-clinical-monthly.md`.
 */

/**
 * Estatus del documento. PENDIENTE de definición del backend (gap B2): hoy el
 * listado sólo devuelve `active: boolean`.
 */
export type ClinicalMonthlyStatus = "DRAFT" | "COMPLETED" | "SIGNED"

export interface ClinicalMonthlyListItem {
  id: string
  clientId: string
  clientName: string
  /** Inicio del período del reporte (ISO date) */
  startDate: string
  /** Fin del período del reporte (ISO date) */
  endDate: string
  /** Fecha de creación. El backend lo nombra `createAt` (sin la "d") */
  createAt: string
  active: boolean

  /**
   * Pendiente de backend: el detalle sí lo resuelve, el listado todavía no.
   * La columna Provider de la tabla aparece sola en cuanto empiece a venir.
   */
  providerName?: string
  /** Pendiente de backend (gap B2) */
  status?: ClinicalMonthlyStatus
}

/** Texto libre por item del Client Service Plan */
export interface ClinicalMonthlyItemInput {
  clientServicePlanCategoryItemId: string
  monthlyDataProgress?: string
  commentsProcedureChange?: string
}

/** Mismo cuerpo para crear (`POST /preview`) y actualizar (`PUT /{id}`) */
export interface SaveClinicalMonthlyDto {
  clientId: string
  /** Mes/año inicial en formato `MM/yyyy` */
  startMonthYear: string
  /** Mes/año final en formato `MM/yyyy` */
  endMonthYear: string
  /**
   * Comentario único del reporte: cambios de procedimiento y/o progreso de la
   * data collection. Reemplaza a los textos por item —el resto del contenido lo
   * arma el PDF desde el Service Plan.
   *
   * ⚠️ Campo nuevo, **pendiente de que backend lo acepte y lo persista**.
   * Ver `docs/clinical-monthly-summary-backend.md`.
   */
  summary?: string
  /**
   * @deprecated El formulario ya no captura textos por item. Se mantiene en el
   * tipo porque el endpoint los sigue aceptando y el detalle los devuelve.
   */
  items?: ClinicalMonthlyItemInput[]
  // Sin `providerId`: el provider del reporte es el usuario logueado que lo crea,
  // así que el backend lo resuelve del token y no se envía desde el front.
}

// ============================================
// DETALLE — GET /reports/clinical-monthly/{id}
// ============================================

export interface ClinicalMonthlyMonth {
  /** Clave del mes, formato `yyyy-MM` */
  key: string
  /** Etiqueta legible, p. ej. "May 2026" */
  label: string
}

export interface ClinicalMonthlyItemValue {
  /** Coincide con `ClinicalMonthlyMonth.key` */
  monthKey: string
  value: number
}

export interface ClinicalMonthlyObjective {
  name: string
  startDate: string
  endDate: string
  status: string
}

export interface ClinicalMonthlyChartPoint {
  label: string
  value: number
  /** true cuando el punto es una línea base y no un dato del período */
  baseline?: boolean
}

export interface ClinicalMonthlyDetailItem {
  clientServicePlanCategoryItemId: string
  name: string
  startDate: string
  baselines: string
  collectionMethod: string
  description: string
  monthlyDataProgress: string
  commentsProcedureChange: string
  values: ClinicalMonthlyItemValue[]
  objectives: ClinicalMonthlyObjective[]
  chartPoints: ClinicalMonthlyChartPoint[]
}

export interface ClinicalMonthlyCategory {
  name: string
  items: ClinicalMonthlyDetailItem[]
}

/**
 * El backend devuelve además campos de compañía, demográficos, seguro, lugar de
 * servicio y `environmentalChanges` que hoy sólo consume el PDF; se tipan los
 * que usa el front y el resto queda accesible por la firma de índice.
 */
export interface ClinicalMonthlyDetail {
  id: string
  clientId: string
  clientName: string
  startDate: string
  endDate: string
  /** `MM/yyyy` — es lo que hay que reenviar en el PUT */
  startMonthYear: string
  /** `MM/yyyy` — es lo que hay que reenviar en el PUT */
  endMonthYear: string
  createAt: string
  active: boolean
  recipientName: string
  providerName: string
  payer: string
  /** Comentario único del reporte. Pendiente de backend, igual que en el DTO */
  summary?: string
  months: ClinicalMonthlyMonth[]
  categories: ClinicalMonthlyCategory[]
  [key: string]: unknown
}

/** Filtros de la vista general, tal como los pide la HU */
export interface ClinicalMonthlyFilters {
  /** Inicio del rango de fecha (yyyy-MM-dd) */
  dateFrom?: string
  /** Fin del rango de fecha (yyyy-MM-dd) */
  dateTo?: string
  clientId?: string
  providerId?: string
  status?: ClinicalMonthlyStatus | "all"
}
