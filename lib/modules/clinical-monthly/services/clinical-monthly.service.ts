import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  ClinicalMonthlyDetail,
  ClinicalMonthlyListItem,
  SaveClinicalMonthlyDto,
} from "@/lib/types/clinical-monthly.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

const BASE_URL = "/reports/clinical-monthly"

export async function getClinicalMonthlies(
  query: QueryModel,
): Promise<{ clinicalMonthlies: ClinicalMonthlyListItem[]; totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<ClinicalMonthlyListItem>>(
    `${BASE_URL}${query ? `?${getQueryString(query)}` : ""}`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch clinical monthlies")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<ClinicalMonthlyListItem>

  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { clinicalMonthlies: [], totalCount: 0 }
  }

  // El contrato documentado no incluye `total` en `pagination` (gap B3). Algunos
  // listados del backend lo mandan como `totalAmount` (ver `clients.service.ts`),
  // así que se aceptan las dos formas y, si no viene ninguna, se cae al largo de
  // la página para que la tabla muestre los resultados en vez de quedar vacía.
  const pagination = paginatedData.pagination as { total?: number; totalAmount?: number } | undefined
  const totalCount = pagination?.totalAmount ?? pagination?.total ?? paginatedData.entities.length

  return {
    clinicalMonthlies: paginatedData.entities,
    totalCount,
  }
}

export async function getClinicalMonthlyById(id: string): Promise<ClinicalMonthlyDetail | null> {
  const response = await serviceGet<ClinicalMonthlyDetail>(`${BASE_URL}/${id}`)

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch clinical monthly")
  }

  return response.data as unknown as ClinicalMonthlyDetail
}

/**
 * Crea el registro `ClinicalMonthly` (cliente, período y `summary`) y devuelve
 * su id. Ya NO genera el PDF: para verlo hay que pedirlo después con
 * `getClinicalMonthlyPdfUrl(id)`.
 *
 * El endpoint se sigue llamando `/preview` por compatibilidad, pero persiste.
 * Por eso el formulario debe crear UNA vez y luego actualizar con `update`:
 * llamarlo de nuevo deja un registro nuevo cada vez.
 */
export async function createClinicalMonthly(data: SaveClinicalMonthlyDto): Promise<string> {
  const response = await servicePost<SaveClinicalMonthlyDto, string>(`${BASE_URL}/preview`, data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create clinical monthly")
  }

  return extractId(response.data, "create")
}

/** Actualiza cliente, período y `summary` del reporte */
export async function updateClinicalMonthly(
  id: string,
  data: SaveClinicalMonthlyDto,
): Promise<string> {
  const response = await servicePut<SaveClinicalMonthlyDto, string>(`${BASE_URL}/${id}`, data)

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to update clinical monthly")
  }

  return extractId(response.data, "update") || id
}

/**
 * El backend responde con el UUID pelado (`"00000000-..."`), no con un objeto.
 * Algunos entornos lo envuelven, así que aceptamos las dos formas.
 */
function extractId(payload: unknown, action: "create" | "update"): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim()

  if (payload && typeof payload === "object") {
    const candidate = (payload as Record<string, unknown>).id ?? (payload as Record<string, unknown>).data
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }

  if (action === "create") {
    throw new Error("Clinical monthly response did not include an id")
  }

  return ""
}

/**
 * URL del proxy same-origin que sirve el PDF de un Clinical Monthly ya creado.
 * El nombre de archivo va en la ruta para que el visor de Chrome muestre un
 * nombre real en vez de un UUID de blob (mismo patrón que Session Note).
 */
export function getClinicalMonthlyPdfUrl(clinicalMonthlyId: string, fileName = "Clinical Monthly.pdf"): string {
  const safeName = encodeURIComponent(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`)
  return `/api/reports/clinical-monthly/preview/${safeName}?clinicalMonthlyId=${encodeURIComponent(clinicalMonthlyId)}`
}
