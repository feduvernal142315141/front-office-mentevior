import { serviceGet, servicePut } from "@/lib/services/baseService"
import type { QueryModel } from "@/lib/models/queryModel"
import { getQueryString } from "@/lib/utils/format"
import type {
  UserCredential,
  UserCredentialTypeOption,
  CreateUserCredentialDto,
  UpdateUserCredentialDto,
} from "@/lib/types/user-credentials.types"

/**
 * Helper seguro para parsear fechas del backend
 * Maneja varios formatos: ISO string, fecha ya formateada, etc.
 */
function parseDateFromBackend(dateValue: string): string {
  if (!dateValue) return ""
  
  // Si ya viene en formato YYYY-MM-DD, devuélvelo tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue
  }
  
  // Si viene como ISO string o timestamp, parsealo
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) {
      console.error("Invalid date value:", dateValue)
      return ""
    }
    return date.toISOString().split('T')[0]
  } catch (err) {
    console.error("Error parsing date:", dateValue, err)
    return ""
  }
}

interface BackendCredentialItem {
  id: string
  credentialId: string
  identificationNumber: string
  credentialName: string
  effectiveDate: string
  expirationDate: string
  status: "active" | "expired"
}

interface BackendCredentialResponse {
  entities: BackendCredentialItem[]
}

export async function getUserCredentialTypes(): Promise<UserCredentialTypeOption[]> {
  const query: QueryModel = {
    page: 0,
    pageSize: 100,
  }
  const response = await serviceGet<{ entities: { id: string; name: string }[] }>(
    `/credential?${getQueryString(query)}`
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch credential types")
  }

  const responseData = response.data as unknown as { entities?: { id: string; name: string }[] }

  if (!responseData.entities || !Array.isArray(responseData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return responseData.entities.map((item) => ({
    id: item.id,
    value: item.id,
    label: item.name,
    requiresIdentificationNumber: true,
  }))
}

export async function getUserCredentials(
  memberUserId: string
): Promise<UserCredential[]> {
  const response = await serviceGet<BackendCredentialResponse | BackendCredentialItem>(
    `/member-users/credential/${memberUserId}`
  )

  if (response.status === 404 || response.status === 204) {
    return []
  }

  if (response.status !== 200) {
    throw new Error(response.data?.message || "Failed to fetch credentials")
  }

  const responseData = response.data as unknown
  const items = Array.isArray((responseData as BackendCredentialResponse)?.entities)
    ? (responseData as BackendCredentialResponse).entities
    : responseData
      ? [responseData as BackendCredentialItem]
      : []

  if (!Array.isArray(items) || items.length === 0) {
    return []
  }

  const normalizedItems = items.filter((item) => {
    return Boolean(
      item &&
      (item.id || item.credentialId || item.credentialName || item.identificationNumber || item.effectiveDate || item.expirationDate)
    )
  })

  if (normalizedItems.length === 0) {
    return []
  }

  return normalizedItems.map((item) => ({
    id: item.id,
    credentialTypeId: item.credentialId,
    credentialTypeName: item.credentialName,
    identificationNumber: item.identificationNumber,
    effectiveDate: parseDateFromBackend(item.effectiveDate),
    expirationDate: parseDateFromBackend(item.expirationDate),
    status: item.status === "active" ? "Active" : "Expired",
    createdAt: item.effectiveDate,
    updatedAt: item.effectiveDate,
  }))
}

export async function updateUserCredential(
  data: CreateUserCredentialDto | UpdateUserCredentialDto
): Promise<UserCredential> {
  const backendPayload: Record<string, unknown> = {
    ...("id" in data && data.id ? { id: data.id } : {}),
    ...(data.credentialId ? { credentialId: data.credentialId } : {}),
    ...(data.identificationNumber ? { identificationNumber: data.identificationNumber } : {}),
    ...(data.effectiveDate ? { effectiveDate: data.effectiveDate } : {}),
    ...(data.expirationDate ? { expirationDate: data.expirationDate } : {}),
    ...(data.memberUserId ? { memberUserId: data.memberUserId } : {}),
    ...(data.status ? { status: data.status.toLowerCase() } : {}),
  }

  const response = await servicePut<typeof backendPayload, BackendCredentialItem>(
    "/member-users/credential",
    backendPayload
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to save credential")
  }

  const item = response.data as unknown as BackendCredentialItem

  return {
    id: item.id,
    credentialTypeId: item.credentialId,
    credentialTypeName: item.credentialName,
    identificationNumber: item.identificationNumber,
    effectiveDate: parseDateFromBackend(item.effectiveDate),
    expirationDate: parseDateFromBackend(item.expirationDate),
    status: item.status === "active" ? "Active" : "Expired", // Mapear lowercase a PascalCase
    createdAt: item.effectiveDate,
    updatedAt: item.effectiveDate,
  }
}
