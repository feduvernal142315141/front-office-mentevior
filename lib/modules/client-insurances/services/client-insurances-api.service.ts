import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  ClientInsurance,
  CreateClientInsuranceDto,
  UpdateClientInsuranceDto,
} from "@/lib/types/client-insurance.types"

/**
 * Normalizes an ISO datetime string (e.g. "2026-03-31T00:00:00.000+00:00")
 * to a plain date string ("2026-03-31") expected by the frontend date pickers.
 * Returns empty string for falsy values.
 */
function normalizeDate(isoDate: string | undefined | null): string {
  if (!isoDate) return ""
  return isoDate.split("T")[0]
}

/**
 * Maps the raw backend response to the frontend ClientInsurance shape,
 * normalizing dates and providing defaults for optional fields.
 */
function normalizeInsurance(raw: Record<string, unknown>): ClientInsurance {
  return {
    id: raw.id as string,
    clientId: (raw.clientId as string) ?? "",
    payerId: raw.payerId as string,
    payerName: (raw.payerName as string) ?? "",
    payerLogoUrl: (raw.payerLogoUrl as string) ?? null,
    memberNumber: (raw.memberNumber as string) ?? "",
    groupNumber: (raw.groupNumber as string) ?? "",
    relationship: (raw.relationship as ClientInsurance["relationship"]) ?? "Self",
    isActive: (raw.isActive as boolean) ?? (raw.active as boolean) ?? true,
    isPrimary: (raw.isPrimary as boolean) ?? false,
    effectiveDate: normalizeDate(raw.effectiveDate as string),
    terminationDate: normalizeDate(raw.terminationDate as string),
    comments: (raw.comments as string) ?? "",
    createdAt: (raw.createdAt as string) ?? "",
    updatedAt: (raw.updatedAt as string) ?? "",
  }
}

export async function getClientInsurancesByClientId(clientId: string): Promise<ClientInsurance[]> {
  const response = await serviceGet<ClientInsurance[]>(`/insurances/by-client-id/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch insurances")
  }

  const data = response.data as unknown

  const raw: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { entities?: unknown[] }).entities)
      ? (data as { entities: Record<string, unknown>[] }).entities
      : []

  return raw.map(normalizeInsurance)
}

export async function createClientInsurance(data: CreateClientInsuranceDto): Promise<string> {
  const response = await servicePost<CreateClientInsuranceDto, string>(
    "/insurances",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create insurance")
  }

  return response.data as unknown as string
}

export async function updateClientInsurance(data: UpdateClientInsuranceDto): Promise<string> {
  const response = await servicePut<UpdateClientInsuranceDto, string>(
    "/insurances",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update insurance")
  }

  return response.data as unknown as string
}

export async function deleteClientInsurance(insuranceId: string): Promise<void> {
  const response = await serviceDelete<void>(`/insurances/${insuranceId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete insurance")
  }
}
