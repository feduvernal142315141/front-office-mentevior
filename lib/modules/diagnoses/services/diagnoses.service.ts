import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  CreateDiagnosisDto,
  Diagnosis,
  UpdateDiagnosisDto,
} from "@/lib/types/diagnosis.types"
import {
  createMockDiagnosis,
  getMockDiagnosesByClientId,
  updateMockDiagnosis,
} from "../mocks/diagnoses.mock"

type DiagnosesDataSource = "mock" | "api"

const DIAGNOSES_DATA_SOURCE: DiagnosesDataSource =
  process.env.NEXT_PUBLIC_DIAGNOSES_DATA_SOURCE === "api" ? "api" : "mock"

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
  if (DIAGNOSES_DATA_SOURCE === "mock") {
    return getMockDiagnosesByClientId(clientId)
  }

  const response = await serviceGet<PaginatedResponse<Diagnosis>>(`/diagnosis/client/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch diagnoses")
  }

  return normalizeDiagnosesResponse(response.data)
}

export async function createDiagnosis(data: CreateDiagnosisDto): Promise<string> {
  if (DIAGNOSES_DATA_SOURCE === "mock") {
    return createMockDiagnosis(data)
  }

  const response = await servicePost<CreateDiagnosisDto, string>("/diagnosis", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create diagnosis")
  }

  return response.data as string
}

export async function updateDiagnosis(diagnosisId: string, data: UpdateDiagnosisDto): Promise<string> {
  if (DIAGNOSES_DATA_SOURCE === "mock") {
    return updateMockDiagnosis(diagnosisId, data)
  }

  const response = await servicePut<UpdateDiagnosisDto, string>(`/diagnosis/${diagnosisId}`, data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update diagnosis")
  }

  return response.data as string
}
