import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type { Caregiver, CreateCaregiverDto, UpdateCaregiverDto } from "@/lib/types/caregiver.types"
import {
  createMockCaregiver,
  getMockCaregiversByClientId,
  updateMockCaregiver,
} from "../mocks/caregivers.mock"

type CaregiversDataSource = "mock" | "api"

const CAREGIVERS_DATA_SOURCE: CaregiversDataSource =
  process.env.NEXT_PUBLIC_CAREGIVERS_DATA_SOURCE === "api" ? "api" : "mock"

function normalizeCaregiversResponse(data: unknown): Caregiver[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data as Caregiver[]
  }

  const paginated = data as PaginatedResponse<Caregiver>
  if (Array.isArray(paginated.entities)) {
    return paginated.entities
  }

  const wrappedData = data as { data?: unknown }
  if (Array.isArray(wrappedData.data)) {
    return wrappedData.data as Caregiver[]
  }

  return []
}

export async function getCaregiversByClientId(clientId: string): Promise<Caregiver[]> {
  if (CAREGIVERS_DATA_SOURCE === "mock") {
    return getMockCaregiversByClientId(clientId)
  }

  const response = await serviceGet<PaginatedResponse<Caregiver>>(`/caregiver/client/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch caregivers")
  }

  return normalizeCaregiversResponse(response.data)
}

export async function createCaregiver(data: CreateCaregiverDto): Promise<string> {
  if (CAREGIVERS_DATA_SOURCE === "mock") {
    return createMockCaregiver(data)
  }

  const response = await servicePost<CreateCaregiverDto, string>("/caregiver", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create caregiver")
  }

  return response.data as string
}

export async function updateCaregiver(caregiverId: string, data: UpdateCaregiverDto): Promise<string> {
  if (CAREGIVERS_DATA_SOURCE === "mock") {
    return updateMockCaregiver(caregiverId, data)
  }

  const response = await servicePut<UpdateCaregiverDto, string>(`/caregiver/${caregiverId}`, data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update caregiver")
  }

  return response.data as string
}
