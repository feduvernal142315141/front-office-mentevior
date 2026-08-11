import { serviceGet, servicePost } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  CreateServiceLogsDto,
  ServiceLogDetail,
  ServiceLogListItem,
  ServiceLogServiceRow,
} from "@/lib/types/service-log.types"

const BASE_URL = "/reports/service-log"

// ============================================
// Normalización
// ============================================

type Json = Record<string, unknown>

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toJson(value: unknown): Json {
  return isObject(value) ? value : {}
}

function toText(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim()
}

/**
 * `initDate`/`endDate` llegan como timestamp ISO UTC
 * (`2026-01-01T00:00:00.000+00:00`). El día real es el prefijo `yyyy-MM-dd`;
 * parsearlo con `new Date()` lo correría un día en zonas horarias negativas.
 */
function toDateOnly(value: unknown): string {
  const text = toText(value)
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
}

/** El contrato manda la firma como Base64 pelado; se envuelve para `<img>`. */
function toSignatureSrc(value: unknown): string | null {
  const text = toText(value)
  if (!text) return null
  if (text.startsWith("data:") || text.startsWith("http")) return text
  return `data:image/png;base64,${text}`
}

function normalizeService(raw: unknown): ServiceLogServiceRow | undefined {
  if (!isObject(raw)) return undefined

  const id = toText(raw.id)
  const date = toText(raw.date)
  // Sin fecha la fila no se puede ubicar en el documento: se descarta.
  if (!id && !date) return undefined

  return {
    id,
    appointmentId: toText(raw.appointmentId),
    appointmentNoteId: toText(raw.appointmentNoteId),
    date,
    timeIn: toText(raw.timeIn),
    timeOut: toText(raw.timeOut),
    hours: toText(raw.hours),
    units: toText(raw.units),
    placeOfService: toText(raw.placeOfService),
    caregiverName: toText(raw.caregiverName),
    caregiverSignatureImage: toSignatureSrc(raw.caregiverSignatureImage),
    caregiverValidation: toText(raw.caregiverValidation),
    // Typo intencional del contrato (ver plans/service-log.md)
    imcomplete: raw.imcomplete === true,
  }
}

// ============================================
// Generación por rango
// ============================================

/**
 * Encola la generación de los Service Logs del rango para TODA la compañía
 * (una cabecera por combinación cliente/provider con servicios en el período).
 *
 * El backend responde `{accepted:true}` y sigue procesando en segundo plano:
 * no devuelve IDs ni contadores, y los errores posteriores solo quedan en su
 * log (Q2 de plans/service-log.md). Un `422` sincrónico significa rango
 * inválido o solapado con un Service Log existente — en ese caso se rechaza
 * la solicitud completa.
 */
export async function createServiceLogs(dto: CreateServiceLogsDto): Promise<void> {
  const response = await servicePost<CreateServiceLogsDto, unknown>(BASE_URL, dto)

  if (response?.status !== 200 && response?.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to queue service log generation"))
  }
}

// ============================================
// Listado
// ============================================

export async function getServiceLogs(
  query: QueryModel,
): Promise<{ items: ServiceLogListItem[]; totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<unknown>>(
    `${BASE_URL}${query ? `?${getQueryString(query)}` : ""}`,
  )

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch service logs"))
  }

  const paginated = response.data as unknown as PaginatedResponse<unknown>

  if (!Array.isArray(paginated.entities)) {
    console.error("[service-log] unexpected list response:", response.data)
    return { items: [], totalCount: 0 }
  }

  // El contrato manda `total`; otros listados del backend usan `totalAmount`.
  const pagination = paginated.pagination as { total?: number; totalAmount?: number } | undefined
  const totalCount = pagination?.total ?? pagination?.totalAmount ?? paginated.entities.length

  const items = paginated.entities
    .map((entity): ServiceLogListItem | undefined => {
      if (!isObject(entity)) return undefined
      const id = toText(entity.id)
      if (!id) return undefined

      return {
        id,
        clientId: toText(entity.clientId),
        clientName: toText(entity.clientName),
        providerId: toText(entity.providerId),
        providerName: toText(entity.providerName),
        initDate: toDateOnly(entity.initDate),
        endDate: toDateOnly(entity.endDate),
        createAt: toDateOnly(entity.createAt),
        active: entity.active !== false,
      }
    })
    .filter((item): item is ServiceLogListItem => item !== undefined)

  return { items, totalCount }
}

// ============================================
// Detalle
// ============================================

export async function getServiceLogById(id: string): Promise<ServiceLogDetail | null> {
  const response = await serviceGet<unknown>(`${BASE_URL}/${id}`)

  if (response?.status === 404) return null

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load service log"))
  }

  const root = toJson(response.data)

  const services = Array.isArray(root.services)
    ? root.services
        .map(normalizeService)
        .filter((row): row is ServiceLogServiceRow => row !== undefined)
    : []

  return {
    id: toText(root.id) || id,
    initDate: toDateOnly(root.initDate),
    endDate: toDateOnly(root.endDate),
    clientId: toText(root.clientId),
    recipient: toText(root.recipient),
    insurance: toText(root.insurance),
    diagnosis: toText(root.diagnosis),
    providerId: toText(root.providerId),
    provider: toText(root.provider),
    credentials: toText(root.credentials),
    priorAuthorizationNumber: toText(root.priorAuthorizationNumber),
    priorAuthorizationStartDate: toText(root.priorAuthorizationStartDate),
    priorAuthorizationEndDate: toText(root.priorAuthorizationEndDate),
    approvedUnits: toText(root.approvedUnits),
    totalHours: toText(root.totalHours),
    services,
  }
}

// ============================================
// PDF
// ============================================

/**
 * Proxy same-origin del PDF. El id va en el **path** del endpoint del backend
 * (`/{id}/preview`), igual que en Case Supervision Log.
 */
export function getServiceLogPdfUrl(
  serviceLogId: string,
  fileName = "Service Log.pdf",
): string {
  const safeName = encodeURIComponent(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`)
  return `/api/reports/service-log/preview/${safeName}?serviceLogId=${encodeURIComponent(serviceLogId)}`
}
