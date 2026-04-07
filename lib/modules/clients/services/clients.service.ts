import type { QueryModel } from "@/lib/models/queryModel"
import type {
  Client,
  ClientListItem,
  CreateClientDto,
  UpdateClientDto,
} from "@/lib/types/client.types"
import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import { getQueryString } from "@/lib/utils/format"
import type { MutationResult, PaginatedResponse } from "@/lib/types/response.types"

interface ClientListBackend extends ClientListItem {
  diagnosisCode?: string
  insurancePayer?: string
  rbtName?: string
}

export async function getClients(query: QueryModel): Promise<{
  clients: ClientListItem[]
  totalCount: number
}> {
  const response = await serviceGet<PaginatedResponse<ClientListBackend>>(`/client${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch clients")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<ClientListBackend>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { clients: [], totalCount: 0 }
  }
  
  return {
    clients: paginatedData.entities.map((client) => ({
      ...client,
      diagnosis: client.diagnosis ?? client.diagnosisCode ?? "",
      insurance: client.insurance ?? client.insurancePayer ?? "",
      rbt: client.rbt ?? client.rbtName ?? "",
    })),
    totalCount: paginatedData.pagination?.total || 0
  }
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const response = await serviceGet<Client>(`/client/${clientId}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch client")
  }

  return response.data as unknown as Client
}

export async function createClient(data: CreateClientDto): Promise<MutationResult & { clientId?: string }> {
  const response = await servicePost<CreateClientDto, { id?: string; progress?: number } | number>("/client", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create client")
  }

  const body = response.data as { id?: string; progress?: number } | number
  const clientId = typeof body === "object" ? body?.id : undefined
  const progress = typeof body === "object" ? (body?.progress ?? 0) : Number(body) || 0

  return { progress, clientId }
}

export async function updateClient(id: string, data: UpdateClientDto): Promise<MutationResult> {
  const response = await servicePut<UpdateClientDto, number>("/client", { ...data, id })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update client")
  }

  return { progress: Number(response.data) || 0 }
}
