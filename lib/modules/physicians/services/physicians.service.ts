import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import type {
  Physician,
  CreatePhysicianRequest,
  UpdatePhysicianRequest,
  PhysiciansListResponse,
  PhysicianResponse,
  PhysicianType
} from "@/lib/types/physician.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"


export async function getPhysicians(query: QueryModel): Promise<{ physicians: Physician[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<Physician>>(`/physicians${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch physicians")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<Physician>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { physicians: [], totalCount: 0 }
  }
  
  return {
    physicians: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}


export async function getPhysicianById(physicianId: string): Promise<Physician | null> {
  const response = await serviceGet<Physician>(`/physicians/${physicianId}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch physician")
  }

  return response.data as unknown as Physician
}


export async function createPhysician(data: CreatePhysicianRequest): Promise<string> {
  const response = await servicePost<CreatePhysicianRequest, string>("/physicians", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create physician")
  }

  return response.data as string
}


export async function updatePhysician(data: UpdatePhysicianRequest): Promise<void> {
  const response = await servicePut<UpdatePhysicianRequest, void>(`/physicians/${data.id}`, data)

  if (response.status !== 200) {
    throw new Error(response.data?.message || "Failed to update physician")
  }
}


export async function deletePhysician(physicianId: string): Promise<void> {
  const response = await serviceDelete<void>(`/physicians/${physicianId}`)

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete physician")
  }
}


export async function getPhysicianTypes(): Promise<PhysicianType[]> {
  const response = await serviceGet<PaginatedResponse<PhysicianType>>("/physician-type")
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch physician types")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<PhysicianType>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return paginatedData.entities
}

