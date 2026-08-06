import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  MonthlySupervisionContext,
  MonthlySupervisionListItem,
  SaveMonthlySupervisionDto,
  SupervisionAppointment,
} from "@/lib/types/monthly-supervision.types"
import { parseReportMonth, toAppointmentsMonthYear } from "../utils/report-month"

const BASE_URL = "/reports/monthly-supervision"

// ============================================
// Listado
// ============================================

export async function getMonthlySupervisions(
  query: QueryModel,
): Promise<{ items: MonthlySupervisionListItem[]; totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<MonthlySupervisionListItem>>(
    `${BASE_URL}${query ? `?${getQueryString(query)}` : ""}`,
  )

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to fetch monthly supervisions"))
  }

  const paginated = response.data as unknown as PaginatedResponse<MonthlySupervisionListItem>

  if (!Array.isArray(paginated.entities)) {
    console.error("[monthly-supervision] unexpected list response:", response.data)
    return { items: [], totalCount: 0 }
  }

  // El contrato manda `total`; otros listados del backend usan `totalAmount`.
  // Se aceptan las dos y, sin ninguna, cae al largo de la página para que la
  // tabla muestre los resultados en vez de quedar vacía.
  const pagination = paginated.pagination as { total?: number; totalAmount?: number } | undefined
  const totalCount = pagination?.total ?? pagination?.totalAmount ?? paginated.entities.length

  return {
    items: paginated.entities.map((entity) => ({
      ...entity,
      // El listado devuelve `yyyyMM`, pero puede haber registros viejos guardados
      // como "February 2026": se normaliza para que la tabla no muestre basura.
      requestedReportDate: parseReportMonth(entity.requestedReportDate) ?? entity.requestedReportDate,
    })),
    totalCount,
  }
}

// ============================================
// Contexto del reporte (los dos endpoints de appointments)
// ============================================

type Json = Record<string, unknown>

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function toIdList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((entry) => toText(entry) ?? "").filter((entry) => entry.length > 0)
}

function normalizeAppointment(raw: unknown): SupervisionAppointment | undefined {
  if (!isObject(raw)) return undefined

  // El listado lo llama `id` y el POST `appointmentId`: se aceptan los dos.
  const appointmentId = toText(raw.appointmentId) ?? toText(raw.id)
  if (!appointmentId) return undefined

  return {
    appointmentId,
    date: toText(raw.date) ?? "",
    duration: toText(raw.duration) ?? String(toNumber(raw.duration) ?? ""),
    summary: toText(raw.summary) ?? "",
    mode: toText(raw.mode),
    structure: toText(raw.structure),
    evaluation: toText(raw.evaluation),
  }
}

/**
 * Convierte la respuesta de cualquiera de los dos endpoints de appointments y
 * —esto es lo importante— **anota qué campos vinieron**.
 *
 * El `PUT` reemplaza appointments y opciones. Si el detalle no trae lo que ya
 * estaba guardado, el formulario tiene que enterarse y bloquear el guardado en
 * vez de mandar vacíos y borrar el trabajo del analista (R3).
 */
function normalizeContext(payload: unknown, isExistingReport: boolean): MonthlySupervisionContext {
  const root = isObject(payload) ? payload : {}
  const supervisor = isObject(root.supervisor) ? root.supervisor : {}
  const supervisee = isObject(root.supervisee) ? root.supervisee : {}

  const appointments = Array.isArray(root.appointments)
    ? root.appointments
        .map(normalizeAppointment)
        .filter((item): item is SupervisionAppointment => item !== undefined)
    : []

  const documentOptionCatalogIds = toIdList(root.documentOptionCatalogIds)
  const appliedOptionCatalogIds = toIdList(root.appliedOptionCatalogIds)
  const clientId = toText(root.clientId)
  const providerId = toText(root.providerId)

  return {
    clientId,
    clientName: toText(root.clientName) ?? "",
    providerId,
    supervisor: {
      name: toText(supervisor.name) ?? "",
      credentials: toText(supervisor.credentials),
    },
    supervisee: { name: toText(supervisee.name) ?? "" },
    totalHoursWorked: toNumber(root.totalHoursWorked) ?? 0,
    supervisedHours: toNumber(root.supervisedHours) ?? 0,
    supervisorSign: toText(root.supervisorSign) ?? null,
    superviseeSign: toText(root.superviseeSign) ?? null,
    requestedReportDate: parseReportMonth(toText(root.requestedReportDate)) ?? undefined,
    otherAppliedOption: toText(root.otherAppliedOption),
    documentOptionCatalogIds,
    appliedOptionCatalogIds,
    appointments,
    completeness: {
      // Al armar un reporte nuevo no hay nada guardado que perder: completo por
      // definición. La bandera sólo tiene sentido sobre un reporte existente.
      options: !isExistingReport || (!!documentOptionCatalogIds && !!appliedOptionCatalogIds),
      evaluations:
        !isExistingReport ||
        appointments.length === 0 ||
        appointments.some((item) => item.mode || item.structure || item.evaluation),
      identifiers: !isExistingReport || (!!clientId && !!providerId),
    },
  }
}

/** Appointments elegibles para armar un reporte nuevo */
export async function getSupervisionAppointments(params: {
  clientId: string
  providerId: string
  /** `yyyyMM` */
  reportMonth: string
}): Promise<MonthlySupervisionContext> {
  const query = new URLSearchParams({
    clientId: params.clientId,
    providerId: params.providerId,
    monthYear: toAppointmentsMonthYear(params.reportMonth),
  })

  const response = await serviceGet<unknown>(`${BASE_URL}/appointments?${query.toString()}`)

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load supervision appointments"))
  }

  return normalizeContext(response.data, false)
}

/** Carga un reporte ya guardado, desde `MonthlySupervisionAppointment` */
export async function getMonthlySupervisionById(id: string): Promise<MonthlySupervisionContext | null> {
  const response = await serviceGet<unknown>(`${BASE_URL}/${id}/appointments`)

  if (response?.status === 404) return null

  if (response?.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load monthly supervision"))
  }

  return normalizeContext(response.data, true)
}

// ============================================
// Crear · actualizar · borrar
// ============================================

export async function createMonthlySupervision(data: SaveMonthlySupervisionDto): Promise<string> {
  const response = await servicePost<SaveMonthlySupervisionDto, string>(BASE_URL, data)

  if (response?.status !== 200 && response?.status !== 201) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to create monthly supervision"))
  }

  return extractId(response.data, "create")
}

export async function updateMonthlySupervision(
  id: string,
  data: SaveMonthlySupervisionDto,
): Promise<string> {
  const response = await servicePut<SaveMonthlySupervisionDto, string>(`${BASE_URL}/${id}`, data)

  if (response?.status !== 200 && response?.status !== 204) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to update monthly supervision"))
  }

  return extractId(response.data, "update") || id
}

export async function deleteMonthlySupervision(id: string): Promise<void> {
  const response = await serviceDelete<undefined, boolean>(`${BASE_URL}/${id}`)

  if (response?.status !== 200 && response?.status !== 204) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to delete monthly supervision"))
  }
}

/** El backend responde con el UUID pelado; algunos entornos lo envuelven. */
function extractId(payload: unknown, action: "create" | "update"): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim()

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    const candidate = record.id ?? record.data
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  if (action === "create") {
    throw new Error("Monthly supervision response did not include an id")
  }

  return ""
}

// ============================================
// PDF
// ============================================

/**
 * Proxy same-origin del PDF. A diferencia de Clinical Monthly, el id va en el
 * **path** del endpoint del backend (`/{id}/preview`), no en query.
 */
export function getMonthlySupervisionPdfUrl(
  monthlySupervisionId: string,
  fileName = "Monthly Supervision.pdf",
): string {
  const safeName = encodeURIComponent(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`)
  return `/api/reports/monthly-supervision/preview/${safeName}?monthlySupervisionId=${encodeURIComponent(monthlySupervisionId)}`
}
