import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  PriorAuthBillingCode,
  CreateAuthorizationBillingCodeDto,
  UpdateAuthorizationBillingCodeDto,
} from "@/lib/types/prior-authorization.types"

function buildBillingCodeLabel(raw: Record<string, unknown>): string {
  return (raw.billingCodeCode as string) ?? ""
}

function normalizeBC(raw: Record<string, unknown>): PriorAuthBillingCode {
  return {
    id: raw.id as string,
    billingCodeId: (raw.billingCodeId as string) ?? "",
    billingCodeLabel: buildBillingCodeLabel(raw),
    approvedUnits: (raw.approvedUnits as number) ?? 0,
    usedUnits: (raw.usedUnits as number) ?? 0,
    remainingUnits:
      ((raw.approvedUnits as number) ?? 0) - ((raw.usedUnits as number) ?? 0),
    unitsInterval: (raw.unitsInterval as "UNIT" | "EVENT") ?? "UNIT",
    maxUnitsPerDay: (raw.maxUnitsPerDay as number) ?? null,
    maxUnitsPerWeek: (raw.maxUnitsPerWeek as number) ?? null,
    maxUnitsPerMonth: (raw.maxUnitsPerMonth as number) ?? null,
    maxCountPerDay: (raw.maxCountPerDay as number) ?? null,
    maxCountPerWeek: (raw.maxCountPerWeek as number) ?? null,
    maxCountPerMonth: (raw.maxCountPerMonth as number) ?? null,
  }
}

export async function getAuthorizationBillingCodesByPriorAuthId(
  priorAuthorizationId: string
): Promise<PriorAuthBillingCode[]> {
  const response = await serviceGet<PriorAuthBillingCode[]>(
    `/authorization-billing-codes/by-prior-authorization-id/${priorAuthorizationId}`
  )

  if (response.status === 404) return []

  if (response.status !== 200 || !response.data) {
    throw new Error(
      (response.data as { message?: string })?.message ||
        "Failed to fetch authorization billing codes"
    )
  }

  const data = response.data as unknown
  const raw: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { entities?: unknown[] }).entities)
      ? (data as { entities: Record<string, unknown>[] }).entities
      : []

  return raw.map(normalizeBC)
}

export async function createAuthorizationBillingCode(
  data: CreateAuthorizationBillingCodeDto
): Promise<PriorAuthBillingCode> {
  const response = await servicePost<CreateAuthorizationBillingCodeDto, Record<string, unknown>>(
    "/authorization-billing-codes",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string })?.message ||
        "Failed to create authorization billing code"
    )
  }

  return normalizeBC(response.data as Record<string, unknown>)
}

export async function updateAuthorizationBillingCode(
  data: UpdateAuthorizationBillingCodeDto
): Promise<PriorAuthBillingCode> {
  const response = await servicePut<UpdateAuthorizationBillingCodeDto, Record<string, unknown>>(
    "/authorization-billing-codes",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string })?.message ||
        "Failed to update authorization billing code"
    )
  }

  return normalizeBC(response.data as Record<string, unknown>)
}

export async function deleteAuthorizationBillingCode(id: string): Promise<void> {
  const response = await serviceDelete<void>(`/authorization-billing-codes/${id}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string })?.message ||
        "Failed to delete authorization billing code"
    )
  }
}
