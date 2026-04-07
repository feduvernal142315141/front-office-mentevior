import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  PriorAuthorization,
  CreatePriorAuthorizationDto,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"
import { calculatePAStatus } from "@/lib/utils/prior-auth-utils"

function normalizeDate(isoDate: string | undefined | null): string {
  if (!isoDate) return ""
  return isoDate.split("T")[0]
}

function normalizeBillingCodeLabel({
  label,
  code,
  modifier,
}: {
  label?: string
  code: string
  modifier?: string
}): string {
  const trimmedLabel = (label ?? "").trim()
  const trimmedModifier = (modifier ?? "").trim()

  const sanitizedLabel = trimmedLabel.replace(/\s*\(\s*\)\s*$/, "").trim()
  if (sanitizedLabel) return sanitizedLabel

  return trimmedModifier ? `${code} (${trimmedModifier})` : code
}

function normalizePA(raw: Record<string, unknown>): PriorAuthorization {
  return {
    id: raw.id as string,
    clientId: (raw.clientId as string) ?? "",
    authNumber: (raw.authNumber as string) ?? "",
    insuranceId: (raw.insuranceId as string) ?? "",
    insuranceName: (raw.insuranceName as string) ?? "",
    memberInsuranceId: (raw.memberInsuranceId as string) ?? "",
    primaryDiagnosisId: (raw.primaryDiagnosisId as string) ?? null,
    primaryDiagnosisCode: (raw.primaryDiagnosisCode as string) ?? null,
    startDate: normalizeDate(raw.startDate as string),
    endDate: normalizeDate(raw.endDate as string),
    durationInterval: (raw.durationInterval as PriorAuthorization["durationInterval"]) ?? "WEEKS",
    requestDate: normalizeDate(raw.requestDate as string) || null,
    responseDate: normalizeDate(raw.responseDate as string) || null,
    comments: (raw.comments as string) ?? null,
    attachment: (raw.attachment as string) ?? null,
    attachmentName: (raw.attachmentName as string) ?? null,
    attachmentDownload: (raw.attachmentDownload as string) ?? null,
    status: calculatePAStatus(
      normalizeDate(raw.startDate as string),
      normalizeDate(raw.endDate as string)
    ),
    billingCodes: (() => {
      const rawBCs = (raw.authorizationBillingCodes ?? raw.billingCodes) as Record<string, unknown>[] | undefined
      if (!Array.isArray(rawBCs)) return []
      return rawBCs.map((bc) => {
        const code = (bc.billingCodeCode as string) ?? ""
        const modifier = (bc.billingCodeModifier as string) ?? ""
        const label = normalizeBillingCodeLabel({
          label: bc.billingCodeLabel as string,
          code,
          modifier,
        })
        return {
          id: bc.id as string,
          billingCodeId: (bc.billingCodeId as string) ?? "",
          billingCodeLabel: label,
          approvedUnits: (bc.approvedUnits as number) ?? 0,
          usedUnits: (bc.usedUnits as number) ?? 0,
          remainingUnits:
            ((bc.approvedUnits as number) ?? 0) - ((bc.usedUnits as number) ?? 0),
          unitsInterval: (bc.unitsInterval as "UNIT" | "EVENT") ?? "UNIT",
          maxUnitsPerDay: (bc.maxUnitsPerDay as number) ?? null,
          maxUnitsPerWeek: (bc.maxUnitsPerWeek as number) ?? null,
          maxUnitsPerMonth: (bc.maxUnitsPerMonth as number) ?? null,
          maxCountPerDay: (bc.maxCountPerDay as number) ?? null,
          maxCountPerWeek: (bc.maxCountPerWeek as number) ?? null,
          maxCountPerMonth: (bc.maxCountPerMonth as number) ?? null,
        }
      })
    })(),
    createdAt: (raw.createdAt as string) ?? "",
    updatedAt: (raw.updatedAt as string) ?? "",
  }
}

export async function getPriorAuthorizationById(
  paId: string
): Promise<PriorAuthorization> {
  const response = await serviceGet<Record<string, unknown>>(
    `/prior-authorizations/${paId}`
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(
      (response.data as { message?: string })?.message || "Failed to fetch prior authorization"
    )
  }

  return normalizePA(response.data as Record<string, unknown>)
}

export async function getPriorAuthorizationsByClientId(
  clientId: string
): Promise<PriorAuthorization[]> {
  const response = await serviceGet<PriorAuthorization[]>(
    `/prior-authorizations/by-client-id/${clientId}`
  )

  if (response.status === 404) return []

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch prior authorizations")
  }

  const data = response.data as unknown
  const raw: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { entities?: unknown[] }).entities)
      ? (data as { entities: Record<string, unknown>[] }).entities
      : []

  return raw.map(normalizePA)
}

export async function createPriorAuthorization(
  data: CreatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  const response = await servicePost<CreatePriorAuthorizationDto, Record<string, unknown>>(
    "/prior-authorizations",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string })?.message || "Failed to create prior authorization"
    )
  }

  return normalizePA(response.data as Record<string, unknown>)
}

export async function updatePriorAuthorization(
  data: UpdatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  const response = await servicePut<UpdatePriorAuthorizationDto, Record<string, unknown>>(
    "/prior-authorizations",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      (response.data as { message?: string })?.message || "Failed to update prior authorization"
    )
  }

  return normalizePA(response.data as Record<string, unknown>)
}

export async function deletePriorAuthorization(paId: string): Promise<void> {
  const response = await serviceDelete<void>(`/prior-authorizations/${paId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(
      (response.data as { message?: string })?.message || "Failed to delete prior authorization"
    )
  }
}
