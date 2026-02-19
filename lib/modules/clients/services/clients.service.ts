import type { QueryModel } from "@/lib/models/queryModel"
import type {
  Client,
  ClientListItem,
  CreateClientDto,
  UpdateClientDto,
} from "@/lib/types/client.types"
import {
  filterMockClients,
  getMockClientById,
  paginateMockClients,
} from "../mocks/clients.mock"

export async function getClients(query: QueryModel): Promise<{
  clients: ClientListItem[]
  totalCount: number
}> {
  const search = query.filters?.find((f) => f.includes("fullName__CONTAINS"))?.split("__")[2]
  const activeFilter = query.filters?.find((f) => f.includes("active__EQ"))
  const active = activeFilter ? activeFilter.split("__")[2] === "true" : undefined
  const insuranceFilter = query.filters?.find((f) => f.includes("insuranceName__EQ"))
  const insurance = insuranceFilter ? insuranceFilter.split("__")[2] : undefined
  const rbtFilter = query.filters?.find((f) => f.includes("rbtName__EQ"))
  const rbt = rbtFilter ? rbtFilter.split("__")[2] : undefined

  const filtered = filterMockClients({ search, active, insurance, rbt })
  const paginated = paginateMockClients(filtered, query.page || 0, query.pageSize || 10)

  return paginated
}

export async function getClientById(clientId: string): Promise<Client | null> {
  const client = getMockClientById(clientId)
  return client || null
}

export async function createClient(data: CreateClientDto): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return `client-${Date.now()}`
}

export async function updateClient(data: UpdateClientDto): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return true
}
