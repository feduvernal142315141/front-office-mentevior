import type {
  CaseSupervisionManualEntry,
  CaseSupervisionManualEntryInput,
} from "@/lib/types/case-supervision-log.types"
import { splitReportMonth } from "@/lib/utils/report-month"

/** Estado de una entrada manual en el formulario. Ningún campo es obligatorio */
export interface ManualEntryFormValue {
  /** Clave local para React; no viaja */
  key: string
  /** Sólo en entradas ya guardadas */
  id?: string
  /** ISO `yyyy-MM-dd` */
  date: string
  /** `HH:mm` */
  timeStart: string
  /** `HH:mm` */
  timeEnd: string
  billingCodeId: string
  serviceType: string
  activityCategoryIds: string[]
  participantIds: string[]
  clientAddressId: string
  modalityCatalogId: string
  characteristic: string
}

let nextKey = 0

export function createEmptyManualEntry(): ManualEntryFormValue {
  nextKey += 1
  return {
    key: `new-${nextKey}`,
    date: "",
    timeStart: "",
    timeEnd: "",
    billingCodeId: "",
    serviceType: "",
    activityCategoryIds: [],
    participantIds: [],
    clientAddressId: "",
    modalityCatalogId: "",
    characteristic: "",
  }
}

export function manualEntryToFormValue(entry: CaseSupervisionManualEntry): ManualEntryFormValue {
  return {
    key: entry.id,
    id: entry.id,
    date: entry.date,
    timeStart: entry.timeStart.slice(0, 5),
    timeEnd: entry.timeEnd.slice(0, 5),
    billingCodeId: entry.billingCodeId,
    serviceType: entry.serviceType,
    activityCategoryIds: entry.activityCategories.map((c) => c.id),
    participantIds: entry.participants.map((p) => p.catalogId),
    clientAddressId: entry.clientAddressId,
    modalityCatalogId: entry.modalityCatalogId,
    characteristic: entry.characteristic,
  }
}

function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** Horas entre inicio y fin con dos decimales; `0` si falta alguno o el fin no es posterior */
export function getManualEntryDuration(timeStart: string, timeEnd: string): number {
  const start = toMinutes(timeStart)
  const end = toMinutes(timeEnd)
  if (start === null || end === null || end <= start) return 0
  return Math.round(((end - start) / 60) * 100) / 100
}

/** Una entrada recién agregada que nadie llenó no se manda al crear */
export function isManualEntryEmpty(entry: ManualEntryFormValue): boolean {
  return (
    !entry.date &&
    !entry.timeStart &&
    !entry.timeEnd &&
    !entry.billingCodeId &&
    !entry.serviceType &&
    entry.activityCategoryIds.length === 0 &&
    entry.participantIds.length === 0 &&
    !entry.clientAddressId &&
    !entry.modalityCatalogId &&
    !entry.characteristic.trim()
  )
}

export function toManualEntryInput(entry: ManualEntryFormValue): CaseSupervisionManualEntryInput {
  return {
    ...(entry.id ? { id: entry.id } : {}),
    activityCategoryIds: entry.activityCategoryIds,
    billingCodeId: entry.billingCodeId || null,
    clientAddressId: entry.clientAddressId || null,
    modalityCatalogId: entry.modalityCatalogId || null,
    participantIds: entry.participantIds,
    serviceType: entry.serviceType || null,
    date: entry.date || null,
    timeStart: entry.timeStart ? `${entry.timeStart}:00` : null,
    timeEnd: entry.timeEnd ? `${entry.timeEnd}:00` : null,
    duration: getManualEntryDuration(entry.timeStart, entry.timeEnd),
    characteristic: entry.characteristic.trim() || null,
  }
}

/** Primer y último día del mes del reporte (`yyyyMM`), para acotar el Date of Service */
export function getReportMonthBounds(reportMonth: string): { minDate?: string; maxDate?: string } {
  const parts = splitReportMonth(reportMonth)
  if (!parts) return {}
  const month = String(parts.monthIndex0 + 1).padStart(2, "0")
  const lastDay = new Date(parts.year, parts.monthIndex0 + 1, 0).getDate()
  return {
    minDate: `${parts.year}-${month}-01`,
    maxDate: `${parts.year}-${month}-${String(lastDay).padStart(2, "0")}`,
  }
}
