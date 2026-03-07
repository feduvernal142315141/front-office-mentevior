import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
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

export async function createMedication(data: CreateMedicationDto): Promise<string> {
  const response = await servicePost<CreateMedicationDto, string>("/client/medication", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create medication")
  }

  return response.data as string
}

export async function updateMedication(medicationId: string, data: UpdateMedicationDto): Promise<string> {
  const response = await servicePut<UpdateMedicationPayload, string>("/client/medication", {
    id: medicationId,
    ...data,
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update medication")
  }

  return response.data as string
}
