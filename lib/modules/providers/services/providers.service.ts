import { serviceDelete, serviceGet, servicePost } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type { AssignProviderDto, ClientProvider } from "@/lib/types/provider.types"

type ProviderApiItem = {
  id?: string
  clientId?: string
  userId?: string
  fullName?: string
  roleName?: string
  active?: boolean
  terminated?: boolean
  createdAt?: string
}

function normalizeProvider(item: ProviderApiItem): ClientProvider {
  return {
    id: item.id ?? "",
    clientId: item.clientId ?? "",
    userId: item.userId ?? "",
    fullName: item.fullName ?? "",
    roleName: item.roleName ?? "",
    active: item.active ?? true,
    terminated: item.terminated ?? false,
    createdAt: item.createdAt,
  }
}

function normalizeProvidersResponse(data: unknown): ClientProvider[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data.map((item) => normalizeProvider(item as ProviderApiItem))
  }

  const paginated = data as PaginatedResponse<ClientProvider>
  if (Array.isArray(paginated.entities)) {
    return paginated.entities.map((item) => normalizeProvider(item as ProviderApiItem))
  }

  const wrapped = data as { data?: unknown }
  if (Array.isArray(wrapped.data)) {
    return (wrapped.data as ProviderApiItem[]).map(normalizeProvider)
  }

  return []
}

export async function getProvidersByClientId(clientId: string): Promise<ClientProvider[]> {
  const response = await serviceGet<PaginatedResponse<ClientProvider>>(`/client/providers/${clientId}`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch providers")
  }

  return normalizeProvidersResponse(response.data)
}

export async function assignProvider(data: AssignProviderDto): Promise<string> {
  const response = await servicePost<AssignProviderDto, string>("/client/provider", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to assign provider")
  }

  return response.data as string
}

export async function removeProvider(providerId: string): Promise<void> {
  const response = await serviceDelete<void>(`/client/provider/${providerId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to remove provider")
  }
}
