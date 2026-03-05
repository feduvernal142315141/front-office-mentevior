import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type { CreateMedicationDto, Medication, UpdateMedicationDto } from "@/lib/types/medication.types"
import {
  createMockMedication,
  getMockMedicationsByClientId,
  updateMockMedication,
} from "../mocks/medications.mock"

type MedicationsDataSource = "mock" | "api"

const MEDICATIONS_DATA_SOURCE: MedicationsDataSource =
  process.env.NEXT_PUBLIC_MEDICATIONS_DATA_SOURCE === "api" ? "api" : "mock"

function normalizeMedicationsResponse(data: unknown): Medication[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data as Medication[]
  }

  const paginated = data as PaginatedResponse<Medication>
  if (Array.isArray(paginated.entities)) {
    return paginated.entities
  }

  const wrappedData = data as { data?: unknown }
  if (Array.isArray(wrappedData.data)) {
    return wrappedData.data as Medication[]
  }

  return []
}

export async function getMedicationsByClientId(clientId: string): Promise<Medication[]> {
  if (MEDICATIONS_DATA_SOURCE === "mock") {
    return getMockMedicationsByClientId(clientId)
  }

  const response = await serviceGet<PaginatedResponse<Medication>>(`/medication/client/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch medications")
  }

  return normalizeMedicationsResponse(response.data)
}

export async function createMedication(data: CreateMedicationDto): Promise<string> {
  if (MEDICATIONS_DATA_SOURCE === "mock") {
    return createMockMedication(data)
  }

  const response = await servicePost<CreateMedicationDto, string>("/medication", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create medication")
  }

  return response.data as string
}

export async function updateMedication(medicationId: string, data: UpdateMedicationDto): Promise<string> {
  if (MEDICATIONS_DATA_SOURCE === "mock") {
    return updateMockMedication(medicationId, data)
  }

  const response = await servicePut<UpdateMedicationDto, string>(`/medication/${medicationId}`, data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update medication")
  }

  return response.data as string
}
