import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  CreateDiagnosisDto,
  Diagnosis,
  UpdateDiagnosisDto,
} from "@/lib/types/diagnosis.types"

type UpdateDiagnosisPayload = UpdateDiagnosisDto & { id: string }

function normalizeDiagnosesResponse(data: unknown): Diagnosis[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data as Diagnosis[]
  }

  const paginated = data as PaginatedResponse<Diagnosis>
  if (Array.isArray(paginated.entities)) {
    return paginated.entities
  }

  const wrappedData = data as { data?: unknown }
  if (Array.isArray(wrappedData.data)) {
    return wrappedData.data as Diagnosis[]
  }

  return []
}

export async function getDiagnosesByClientId(clientId: string): Promise<Diagnosis[]> {
  const response = await serviceGet<PaginatedResponse<Diagnosis>>(`/client/diagnoses/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch diagnoses")
  }

  return normalizeDiagnosesResponse(response.data)
}

export async function createDiagnosis(data: CreateDiagnosisDto): Promise<string> {
  const response = await servicePost<CreateDiagnosisDto, string>("/client/diagnosis", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create diagnosis")
  }

  return response.data as string
}

export async function updateDiagnosis(diagnosisId: string, data: UpdateDiagnosisDto): Promise<string> {
  const response = await servicePut<UpdateDiagnosisPayload, string>("/client/diagnosis", {
    id: diagnosisId,
    ...data,
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update diagnosis")
  }

  return response.data as string
}
