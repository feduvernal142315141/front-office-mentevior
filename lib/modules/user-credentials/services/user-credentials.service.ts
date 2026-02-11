import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
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

interface BackendCredentialCatalogItem {
  id: string
  name: string
}

interface BackendCredentialResponse {
  entities: {
    id: string
    credentialId: string
    identificationNumber: string
    credentialName: string
    effectiveDate: string
    expirationDate: string
    status: "active" | "expired" // Backend usa lowercase
  }[]
}

export async function getUserCredentialTypes(): Promise<UserCredentialTypeOption[]> {
  const response = await serviceGet<{ entities: BackendCredentialCatalogItem[] }>("/signature-credential/catalog")

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch credential types")
  }

  const responseData = response.data as unknown as { entities: BackendCredentialCatalogItem[] }

  if (!responseData.entities || !Array.isArray(responseData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return responseData.entities.map(item => ({
    id: item.id,
    value: item.name,
    label: item.name,
    requiresIdentificationNumber: true,
  }))
}

export async function getUserCredentials(): Promise<UserCredential[]> {
  const response = await serviceGet<BackendCredentialResponse>("/member-users/credential")

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch credentials")
  }

  const responseData = response.data as unknown as BackendCredentialResponse

  if (!responseData.entities || !Array.isArray(responseData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return responseData.entities.map(item => ({
    id: item.id,
    credentialTypeId: item.credentialId,
    credentialTypeName: item.credentialName,
    identificationNumber: item.identificationNumber,
    effectiveDate: parseDateFromBackend(item.effectiveDate),
    expirationDate: parseDateFromBackend(item.expirationDate),
    status: item.status === "active" ? "Active" : "Expired", // Mapear lowercase a PascalCase
    createdAt: item.effectiveDate,
    updatedAt: item.effectiveDate,
  }))
}

export async function createUserCredential(data: CreateUserCredentialDto): Promise<UserCredential> {
  // Convertir status de PascalCase a lowercase para el backend
  const backendPayload = {
    credentialId: data.credentialId,
    identificationNumber: data.identificationNumber,
    effectiveDate: data.effectiveDate,
    expirationDate: data.expirationDate,
    status: data.status?.toLowerCase() as "active" | "expired", // Convertir "Active" → "active"
  }

  const response = await servicePost<typeof backendPayload, BackendCredentialResponse["entities"][0]>(
    "/member-users/credential",
    backendPayload
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create credential")
  }

  const item = response.data as unknown as BackendCredentialResponse["entities"][0]

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

export async function updateUserCredential(
  id: string,
  data: Omit<UpdateUserCredentialDto, "id">
): Promise<UserCredential> {
  // Convertir status de PascalCase a lowercase para el backend
  const backendPayload: Record<string, unknown> = {
    id,
    ...(data.credentialId && { credentialId: data.credentialId }),
    ...(data.identificationNumber && { identificationNumber: data.identificationNumber }),
    ...(data.effectiveDate && { effectiveDate: data.effectiveDate }),
    ...(data.expirationDate && { expirationDate: data.expirationDate }),
    ...(data.status && { status: data.status.toLowerCase() }), // Convertir "Active" → "active"
  }

  const response = await servicePut<typeof backendPayload, BackendCredentialResponse["entities"][0]>(
    "/member-users/credential",
    backendPayload
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update credential")
  }

  const item = response.data as unknown as BackendCredentialResponse["entities"][0]

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
