import { serviceDelete, serviceGet, servicePost } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  AssignClientPhysicianDto,
  ClientPhysician,
  CreateManualClientPhysicianDto,
} from "@/lib/types/client-physician.types"

type ClientPhysicianApiItem = {
  id?: string
  clientId?: string
  physicianId?: string
  firstName?: string
  lastName?: string
  fullName?: string
  specialty?: string
  specialtyName?: string
  type?: string
  typeName?: string
  npi?: string
  mpi?: string
  phone?: string
  fax?: string
  email?: string
  active?: boolean
  isManual?: boolean
  createdAt?: string
}

function normalizeClientPhysician(item: ClientPhysicianApiItem): ClientPhysician {
  const firstName = item.firstName ?? ""
  const lastName = item.lastName ?? ""
  const fullName = item.fullName?.trim() || [firstName, lastName].filter(Boolean).join(" ")

  return {
    id: item.id ?? "",
    clientId: item.clientId ?? "",
    physicianId: item.physicianId ?? "",
    firstName,
    lastName,
    fullName,
    specialty: item.specialty ?? "",
    specialtyName: item.specialtyName,
    type: item.type ?? "",
    typeName: item.typeName,
    npi: item.npi ?? "",
    mpi: item.mpi ?? "",
    phone: item.phone ?? "",
    fax: item.fax,
    email: item.email ?? "",
    active: item.active ?? true,
    isManual: item.isManual,
    createdAt: item.createdAt,
  }
}

function normalizeClientPhysiciansResponse(data: unknown): ClientPhysician[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data.map((item) => normalizeClientPhysician(item as ClientPhysicianApiItem))
  }

  const paginated = data as PaginatedResponse<ClientPhysician>
  if (Array.isArray(paginated.entities)) {
    return paginated.entities.map((item) =>
      normalizeClientPhysician(item as ClientPhysicianApiItem)
    )
  }

  const wrapped = data as { data?: unknown }
  if (Array.isArray(wrapped.data)) {
    return (wrapped.data as ClientPhysicianApiItem[]).map(normalizeClientPhysician)
  }

  return []
}

export async function getClientPhysicians(clientId: string): Promise<ClientPhysician[]> {
  const response = await serviceGet<PaginatedResponse<ClientPhysician>>(
    `/client/physicians/${clientId}`
  )

  if (response.status === 404) return []

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch physicians")
  }

  return normalizeClientPhysiciansResponse(response.data)
}

export async function assignClientPhysician(data: AssignClientPhysicianDto): Promise<string> {
  const response = await servicePost<AssignClientPhysicianDto, string>(
    "/client/physician",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to assign physician")
  }

  return response.data as string
}

export async function createManualClientPhysician(
  data: CreateManualClientPhysicianDto
): Promise<string> {
  const response = await servicePost<CreateManualClientPhysicianDto, string>(
    "/physicians",
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create physician")
  }

  return response.data as string
}

export async function removeClientPhysician(clientPhysicianId: string): Promise<void> {
  const response = await serviceDelete<void>(`/client/physician/${clientPhysicianId}`)

  if (
    response.status !== 200 &&
    response.status !== 201 &&
    response.status !== 204
  ) {
    throw new Error(response.data?.message || "Failed to remove physician")
  }
}
