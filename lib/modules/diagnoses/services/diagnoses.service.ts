import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  CreateDiagnosisDto,
  Diagnosis,
  UpdateDiagnosisDto,
} from "@/lib/types/diagnosis.types"

type UpdateDiagnosisPayload = UpdateDiagnosisDto & { id: string }

type DiagnosisApiItem = {
  id?: string
  clientId?: string
  physicianId?: string
  physicianName?: string
  physicianFirstName?: string
  physicianLastName?: string
  physicianSpecialty?: string
  physicianType?: string
  referringPhysicianName?: string
  referringPhysicianId?: string
  physician?: {
    id?: string
    firstName?: string
    lastName?: string
    fullName?: string
    specialty?: string
    type?: string
  }
  code?: string
  name?: string
  referralDate?: string
  treatmentStartDate?: string
  status?: boolean
  treatmentEndDate?: string
  isPrimary?: boolean
  attachment?: string
  attachmentDownload?: string
  attachmentFileName?: string
  createdAt?: string
}

function normalizeDiagnosis(item: DiagnosisApiItem): Diagnosis {
  const physicianId = item.physicianId ?? item.referringPhysicianId ?? item.physician?.id
  const physicianFirstName = item.physicianFirstName ?? item.physician?.firstName
  const physicianLastName = item.physicianLastName ?? item.physician?.lastName
  const physicianName =
    item.physicianName ??
    item.referringPhysicianName ??
    item.physician?.fullName ??
    [physicianFirstName, physicianLastName].filter(Boolean).join(" ")

  return {
    id: item.id ?? "",
    clientId: item.clientId ?? "",
    physicianId,
    physicianName,
    physicianFirstName,
    physicianLastName,
    physicianSpecialty: item.physicianSpecialty ?? item.physician?.specialty,
    physicianType: item.physicianType ?? item.physician?.type,
    code: item.code ?? "",
    name: item.name ?? "",
    referralDate: item.referralDate ?? "",
    treatmentStartDate: item.treatmentStartDate ?? "",
    status: item.status ?? true,
    treatmentEndDate: item.treatmentEndDate,
    isPrimary: item.isPrimary ?? false,
    attachment: item.attachment,
    attachmentDownload: item.attachmentDownload,
    attachmentFileName: item.attachmentFileName,
    createdAt: item.createdAt,
  }
}

function normalizeDiagnosesResponse(data: unknown): Diagnosis[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data.map((item) => normalizeDiagnosis(item as DiagnosisApiItem))
  }

  const paginated = data as PaginatedResponse<Diagnosis>
  if (Array.isArray(paginated.entities)) {
    return paginated.entities.map((item) => normalizeDiagnosis(item as DiagnosisApiItem))
  }

  const wrappedData = data as { data?: unknown }
  if (Array.isArray(wrappedData.data)) {
    return wrappedData.data.map((item) => normalizeDiagnosis(item as DiagnosisApiItem))
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

export async function getDiagnosisById(diagnosisId: string): Promise<Diagnosis | null> {
  const response = await serviceGet<DiagnosisApiItem>(`/client/diagnosis/${diagnosisId}`)

  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch diagnosis")
  }

  const wrapped = response.data as { data?: unknown }
  const item = (wrapped?.data ?? response.data) as DiagnosisApiItem

  return normalizeDiagnosis(item)
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

export async function removeDiagnosis(diagnosisId: string): Promise<void> {
  const response = await serviceDelete<void>(`/client/diagnosis/${diagnosisId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to remove diagnosis")
  }
}
