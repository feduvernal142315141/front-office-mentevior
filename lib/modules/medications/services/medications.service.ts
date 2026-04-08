import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { MutationResult, PaginatedResponse } from "@/lib/types/response.types"
import type { CreateMedicationDto, Medication, UpdateMedicationDto } from "@/lib/types/medication.types"

type UpdateMedicationPayload = UpdateMedicationDto & { id: string }

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
  const response = await serviceGet<PaginatedResponse<Medication>>(`/client/medications/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch medications")
  }

  return normalizeMedicationsResponse(response.data)
}

export async function createMedication(data: CreateMedicationDto): Promise<MutationResult> {
  const response = await servicePost<CreateMedicationDto, number>("/client/medication", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create medication")
  }

  return { progress: Number(response.data) || 0 }
}

export async function updateMedication(medicationId: string, data: UpdateMedicationDto): Promise<MutationResult> {
  const response = await servicePut<UpdateMedicationPayload, number>("/client/medication", {
    id: medicationId,
    ...data,
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update medication")
  }

  return { progress: Number(response.data) || 0 }
}

export async function removeMedication(medicationId: string): Promise<number> {
  const response = await serviceDelete<number>(`/client/medication/${medicationId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to remove medication")
  }

  return Number(response.data) || 0
}
