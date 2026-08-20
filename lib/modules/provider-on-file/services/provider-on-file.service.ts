import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { ProviderOnFile, SaveProviderOnFileDto } from "@/lib/types/provider-on-file.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

const BASE_URL = "/provider-on-file"

function normalizeProvider(raw: Record<string, unknown>): ProviderOnFile {
  const str = (v: unknown) => (typeof v === "string" ? v : "")
  return {
    id: str(raw.id),
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    agencyName: str(raw.agencyName),
    // [sic] typo del contrato; se acepta la variante corregida por si backend la arregla
    specialyId: str(raw.specialyId) || str(raw.specialtyId),
    specialyName: str(raw.specialyName) || str(raw.specialtyName) || undefined,
    specialyCode: str(raw.specialyCode) || str(raw.specialtyCode) || undefined,
    phone: str(raw.phone),
    email: str(raw.email),
  }
}

export async function getProvidersOnFile(
  query?: QueryModel,
): Promise<{ providers: ProviderOnFile[]; totalCount: number }> {
  const qs = query ? `?${getQueryString(query)}` : ""
  const response = await serviceGet<PaginatedResponse<ProviderOnFile>>(`${BASE_URL}${qs}`)

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch providers on file")
  }

  const data = response.data as unknown as PaginatedResponse<ProviderOnFile>
  if (!Array.isArray(data.entities)) return { providers: [], totalCount: 0 }

  const pagination = data.pagination as { total?: number; totalAmount?: number } | undefined
  return {
    providers: data.entities.map((e) => normalizeProvider(e as unknown as Record<string, unknown>)),
    totalCount: pagination?.totalAmount ?? pagination?.total ?? data.entities.length,
  }
}

export async function getProviderOnFileById(id: string): Promise<ProviderOnFile | null> {
  const response = await serviceGet<ProviderOnFile>(`${BASE_URL}/${id}`)

  if (response.status === 404) return null
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch provider on file")
  }

  return normalizeProvider(response.data as unknown as Record<string, unknown>)
}

export async function createProviderOnFile(data: SaveProviderOnFileDto): Promise<string> {
  const response = await servicePost<SaveProviderOnFileDto, string>(BASE_URL, data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create provider on file")
  }

  return extractId(response.data)
}

export async function updateProviderOnFile(id: string, data: SaveProviderOnFileDto): Promise<string> {
  const response = await servicePut<SaveProviderOnFileDto, string>(`${BASE_URL}/${id}`, data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update provider on file")
  }

  return extractId(response.data) || id
}

export async function deleteProviderOnFile(id: string): Promise<void> {
  const response = await serviceDelete<unknown>(`${BASE_URL}/${id}`)

  if (response.status !== 200 && response.status !== 204) {
    throw new Error((response.data as { message?: string })?.message || "Failed to delete provider on file")
  }
}

/** El backend responde el UUID pelado; algunos entornos lo envuelven */
function extractId(payload: unknown): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim()
  if (payload && typeof payload === "object") {
    const candidate = (payload as Record<string, unknown>).id ?? (payload as Record<string, unknown>).data
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim()
  }
  return ""
}
