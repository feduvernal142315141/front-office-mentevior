import { serviceGet, servicePost } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  CaseSupervisionAppointment,
  CaseSupervisionLogDetail,
  CaseSupervisionLogListItem,
  CaseSupervisionPreparation,
  CreateCaseSupervisionLogDto,
} from "@/lib/types/case-supervision-log.types"
import { fromMonthYearParam, toMonthYearParam } from "../utils/month-year"

const BASE_URL = "/reports/case-supervision-log"

// ============================================
// Normalización
// ============================================

type Json = Record<string, unknown>

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** La raíz de la respuesta como objeto indexable, o vacío si no lo es */
function toJson(value: unknown): Json {
  return isObject(value) ? value : {}
}

function toText(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim()
}

/** Acepta `1.5` y `"1.50"`; `0` para lo que no se pueda leer */
function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

/** Como `toNumber` pero distingue "no vino" de "vino 0" */
function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined
  const parsed = toNumber(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeAppointment(raw: unknown): CaseSupervisionAppointment | undefined {
  if (!isObject(raw)) return undefined

  const date = toText(raw.date)
  // Sin fecha la fila no se puede ni ubicar ni ordenar: se descarta antes de
  // pintar una línea muda en medio del reporte.
  if (!date) return undefined

  return {
    id: toText(raw.id) || undefined,
    date,
    timeStart: toText(raw.timeStart),
    timeEnd: toText(raw.timeEnd),
    duration: toNumber(raw.duration),
    characteristic: toText(raw.characteristic),
  }
}

function normalizeAppointments(raw: unknown): CaseSupervisionAppointment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizeAppointment)
    .filter((item): item is CaseSupervisionAppointment => item !== undefined)
}

// ============================================
// Preparación
// ============================================

/**
 * Appointments y totales del período, para armar el reporte antes de crearlo.
 *
 * Es una consulta, no un borrador: nada de esto queda guardado hasta el `POST`,
 * y el `POST` **vuelve a calcularlo todo** desde la base.
 */
export async function getCaseSupervisionAppointments(params: {
  clientId: string
  providerId: string
  /** `yyyyMM` */
  reportMonth: string
}): Promise<CaseSupervisionPreparation> {
  const query = new URLSearchParams({
    clientId: params.clientId,
    providerId: params.providerId,
    monthYear: toMonthYearParam(params.reportMonth),
  })

  const response = await serviceGet<unknown>(`${BASE_URL}/appointments?${query.toString()}`)

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load supervision appointments"))
  }

  const root = toJson(response.data)

  return {
    totalsHours: toNumber(root.totalsHours),
    supervisionHours: toNumber(root.supervisionHours),
    appointments: normalizeAppointments(root.appointments),
  }
}

// ============================================
// Listado
// ============================================

export async function getCaseSupervisionLogs(
  query: QueryModel,
): Promise<{ items: CaseSupervisionLogListItem[]; totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<unknown>>(
    `${BASE_URL}${query ? `?${getQueryString(query)}` : ""}`,
  )

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch case supervision logs"))
  }

  const paginated = response.data as unknown as PaginatedResponse<unknown>

  if (!Array.isArray(paginated.entities)) {
    console.error("[case-supervision-log] unexpected list response:", response.data)
    return { items: [], totalCount: 0 }
  }

  // El contrato manda `total`; otros listados del backend usan `totalAmount`. Se
  // aceptan las dos y, sin ninguna, cae al largo de la página para que la tabla
  // muestre los resultados en vez de quedar vacía.
  const pagination = paginated.pagination as { total?: number; totalAmount?: number } | undefined
  const totalCount = pagination?.total ?? pagination?.totalAmount ?? paginated.entities.length

  const items = paginated.entities
    .map((entity): CaseSupervisionLogListItem | undefined => {
      if (!isObject(entity)) return undefined
      const id = toText(entity.id)
      if (!id) return undefined

      return {
        id,
        clientId: toText(entity.clientId),
        clientName: toText(entity.clientName),
        providerId: toText(entity.providerId),
        providerName: toText(entity.providerName),
        // `MMyyyy` en el borde, `yyyyMM` adentro
        monthYear: fromMonthYearParam(entity.monthYear) ?? "",
        totalsHours: toOptionalNumber(entity.totalsHours),
        supervisionHours: toOptionalNumber(entity.supervisionHours),
      }
    })
    .filter((item): item is CaseSupervisionLogListItem => item !== undefined)

  return { items, totalCount }
}

// ============================================
// Detalle
// ============================================

export async function getCaseSupervisionLogById(
  id: string,
): Promise<CaseSupervisionLogDetail | null> {
  const response = await serviceGet<unknown>(`${BASE_URL}/${id}`)

  if (response?.status === 404) return null

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load case supervision log"))
  }

  const root = toJson(response.data)
  const date = toText(root.date)

  return {
    id: toText(root.id) || id,
    clientId: toText(root.clientId),
    clientName: toText(root.clientName),
    providerId: toText(root.providerId),
    providerName: toText(root.providerName),
    date,
    // El detalle trae `monthYear` en `MMyyyy`; si faltara se deriva de `date`,
    // que es de donde el backend lo calcula.
    monthYear: fromMonthYearParam(root.monthYear) ?? date.slice(0, 7).replace("-", ""),
    totalsHours: toNumber(root.totalsHours),
    supervisionHours: toNumber(root.supervisionHours),
    appointments: normalizeAppointments(root.appointments),
  }
}

// ============================================
// Alta
// ============================================

export async function createCaseSupervisionLog(
  data: CreateCaseSupervisionLogDto,
): Promise<string> {
  const response = await servicePost<CreateCaseSupervisionLogDto, string>(BASE_URL, data)

  if (response?.status !== 200 && response?.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to create case supervision log"))
  }

  return extractId(response.data)
}

/** El backend responde con el UUID pelado; algunos entornos lo envuelven. */
function extractId(payload: unknown): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim()

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    const candidate = record.id ?? record.data
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  throw new Error("Case supervision log response did not include an id")
}

// ============================================
// PDF
// ============================================

/**
 * Proxy same-origin del PDF. El id va en el **path** del endpoint del backend
 * (`/{id}/preview`), igual que en Monthly Supervision.
 */
export function getCaseSupervisionLogPdfUrl(
  caseSupervisionLogId: string,
  fileName = "Case Supervision Log.pdf",
): string {
  const safeName = encodeURIComponent(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`)
  return `/api/reports/case-supervision-log/preview/${safeName}?caseSupervisionLogId=${encodeURIComponent(caseSupervisionLogId)}`
}
