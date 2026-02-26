import type { QueryModel } from "@/lib/models/queryModel"
import type {
  Client,
  ClientListItem,
  CreateClientDto,
  UpdateClientDto,
} from "@/lib/types/client.types"
import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import { getQueryString } from "@/lib/utils/format"
import type { PaginatedResponse } from "@/lib/types/response.types"

export async function getClients(query: QueryModel): Promise<{
  clients: ClientListItem[]
  totalCount: number
}> {
  const response = await serviceGet<PaginatedResponse<ClientListItem>>(`/client${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch clients")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<ClientListItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { clients: [], totalCount: 0 }
  }
  
  return {
    clients: paginatedData.entities,
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

export async function createClient(data: CreateClientDto): Promise<string> {
  const response = await servicePost<CreateClientDto, string>("/client", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create client")
  }

  return response.data as unknown as string
}

export async function updateClient(id: string, data: UpdateClientDto): Promise<boolean> {
  const response = await servicePut<UpdateClientDto, boolean>("/client", { ...data, id })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update client")
  }

  return response.data as unknown as boolean
}
