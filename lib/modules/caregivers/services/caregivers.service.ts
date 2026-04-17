import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import { parseProgressOrNull, parseProgressOrZero } from "@/lib/utils/progress"
import type { MutationResult, PaginatedResponse, UpdateMutationResult } from "@/lib/types/response.types"
import type { Caregiver, CreateCaregiverDto, UpdateCaregiverDto } from "@/lib/types/caregiver.types"

type UpdateCaregiverPayload = UpdateCaregiverDto & { id: string }

type CaregiverApiItem = {
  id?: string
  clientId?: string
  fullName?: string
  firstName?: string
  lastName?: string
  relationshipId?: string
  relationship?: string
  phone?: string
  phoneNumber?: string
  email?: string
  status?: boolean
  isPrimary?: boolean
  createdAt?: string
}

function splitFullName(fullName: string): { firstName: string, lastName: string } {
  const normalized = fullName.trim().replace(/\s+/g, " ")

  if (!normalized) {
    return { firstName: "", lastName: "" }
  }

  const [firstName, ...rest] = normalized.split(" ")
  return { firstName, lastName: rest.join(" ") }
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }

  return fallback
}

function normalizeCaregiver(item: CaregiverApiItem): Caregiver {
  const trimmedFullName = (item.fullName ?? "").trim()
  const hasFirstName = (item.firstName ?? "").trim().length > 0
  const hasLastName = (item.lastName ?? "").trim().length > 0
  const parsedName = splitFullName(trimmedFullName)

  const firstName = hasFirstName ? (item.firstName ?? "").trim() : parsedName.firstName
  const lastName = hasLastName ? (item.lastName ?? "").trim() : parsedName.lastName

  return {
    id: item.id ?? "",
    clientId: item.clientId ?? "",
    firstName,
    lastName,
    fullName: trimmedFullName || [firstName, lastName].filter(Boolean).join(" "),
    relationshipId: item.relationshipId ?? "",
    relationship: item.relationship,
    phone: item.phone ?? item.phoneNumber ?? "",
    phoneNumber: item.phoneNumber,
    email: item.email ?? "",
    status: toBoolean(item.status, true),
    isPrimary: toBoolean(item.isPrimary, false),
    createdAt: item.createdAt,
  }
}

function normalizeCaregivers(items: unknown[]): Caregiver[] {
  return items.map((item) => normalizeCaregiver(item as CaregiverApiItem))
}

function normalizeCaregiversResponse(data: unknown): Caregiver[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return normalizeCaregivers(data)
  }

  const paginated = data as PaginatedResponse<Caregiver>
  if (Array.isArray(paginated.entities)) {
    return normalizeCaregivers(paginated.entities)
  }

  const wrappedData = data as { data?: unknown }
  if (Array.isArray(wrappedData.data)) {
    return normalizeCaregivers(wrappedData.data)
  }

  return []
}

export async function getCaregiversByClientId(clientId: string): Promise<Caregiver[]> {
  const response = await serviceGet<PaginatedResponse<Caregiver>>(`/client/caregivers/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch caregivers")
  }

  return normalizeCaregiversResponse(response.data)
}

export async function createCaregiver(data: CreateCaregiverDto): Promise<MutationResult> {
  const response = await servicePost<CreateCaregiverDto, number>("/client/caregiver", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create caregiver")
  }

  return { progress: parseProgressOrZero(response.data) }
}

export async function updateCaregiver(caregiverId: string, data: UpdateCaregiverDto): Promise<UpdateMutationResult> {
  const response = await servicePut<UpdateCaregiverPayload, number>("/client/caregiver", {
    id: caregiverId,
    ...data,
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update caregiver")
  }

  return { progress: parseProgressOrNull(response.data) }
}

export async function removeCaregiver(caregiverId: string): Promise<number> {
  const response = await serviceDelete<number>(`/client/caregiver/${caregiverId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to remove caregiver")
  }

  return parseProgressOrZero(response.data)
}
