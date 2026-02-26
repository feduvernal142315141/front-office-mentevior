import type { QueryModel } from "@/lib/models/queryModel"
import type {
  Client,
  ClientListItem,
  CreateClientDto,
  UpdateClientDto,
} from "@/lib/types/client.types"
import apiInstance from "@/lib/services/apiConfig"

interface PaginatedResponse<T> {
  entities: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export async function getClients(query: QueryModel): Promise<{
  clients: ClientListItem[]
  totalCount: number
}> {
  const response = await apiInstance.get<PaginatedResponse<ClientListItem>>("/client", {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      filters: query.filters,
      orders: query.orders,
    },
  })
  
  return {
    clients: response.data.entities,
    totalCount: response.data.pagination.total,
  }
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const response = await apiInstance.get<Client>(`/client/${clientId}`)
  return response.data
}

export async function createClient(data: CreateClientDto): Promise<string> {
  const response = await apiInstance.post<{ id: string }>("/client", data)
  return response.data.id
}

export async function updateClient(id: string, data: UpdateClientDto): Promise<boolean> {
  await apiInstance.put("/client", { ...data, id })
  return true
}
