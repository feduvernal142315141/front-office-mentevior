// ============================================
// SERVICE LOG TYPES
// Contrato backend 2026-08-10 (plans/service-log.md)
// ============================================

/** Fila de servicio dentro del detalle del Service Log */
export interface ServiceLogServiceRow {
  id: string
  appointmentId: string
  appointmentNoteId: string
  /** Ya formateada por el backend: `MM/dd/yyyy` */
  date: string
  /** Ya formateada por el backend: `11:00 AM` */
  timeIn: string
  timeOut: string
  hours: string
  /** Billing code + modifier + unidades, p.ej. `97156 (8)` */
  units: string
  placeOfService: string
  caregiverName: string
  /** data URI listo para `<img>`, o `null` si no hay firma dibujada */
  caregiverSignatureImage: string | null
  /** `Confirmed electronically` / `No signature` cuando la compañía usa checkmark */
  caregiverValidation: string
  /**
   * Typo intencional conservado del contrato backend. `true` cuando falta la
   * validación del caregiver o la firma del provider; la fila se pinta en rojo,
   * igual que en el PDF.
   */
  imcomplete: boolean
}

/** Item del listado GET /reports/service-log */
export interface ServiceLogListItem {
  id: string
  clientId: string
  clientName: string
  providerId: string
  providerName: string
  /** `yyyy-MM-dd` (recortado del timestamp UTC del backend) */
  initDate: string
  /** `yyyy-MM-dd` */
  endDate: string
  /** `yyyy-MM-dd` */
  createAt: string
  active: boolean
}

/** GET /reports/service-log/{id} */
export interface ServiceLogDetail {
  id: string
  /** `yyyy-MM-dd` (recortado del timestamp UTC del backend) */
  initDate: string
  /** `yyyy-MM-dd` */
  endDate: string
  clientId: string
  recipient: string
  /** Ya enmascarado por el backend: `*****8525` */
  insurance: string
  diagnosis: string
  providerId: string
  provider: string
  credentials: string
  /** Con varias autorizaciones en el rango, los valores vienen unidos con ` | ` */
  priorAuthorizationNumber: string
  priorAuthorizationStartDate: string
  priorAuthorizationEndDate: string
  approvedUnits: string
  totalHours: string
  services: ServiceLogServiceRow[]
}

/**
 * POST /reports/service-log — genera de forma asíncrona los Service Logs de
 * TODAS las combinaciones cliente/provider de la compañía dentro del rango.
 * Fechas inclusivas.
 */
export interface CreateServiceLogsDto {
  /** `yyyy-MM-dd` */
  initDate: string
  /** `yyyy-MM-dd` */
  endDate: string
}
