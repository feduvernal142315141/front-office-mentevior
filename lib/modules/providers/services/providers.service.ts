import { serviceDelete, serviceGet, servicePost } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type { AssignProviderDto, ClientProvider } from "@/lib/types/provider.types"

type ProviderApiItem = {
  id?: string
  clientProviderId?: string
  providerId?: string
  clientId?: string
  userId?: string
  memberUserId?: string
  fullName?: string
  firstName?: string
  lastName?: string
  roleName?: string
  role?: {
    name?: string
  }
  active?: boolean
  terminated?: boolean
  user?: {
    id?: string
    fullName?: string
    firstName?: string
    lastName?: string
    roleName?: string
    role?: {
      name?: string
    }
    active?: boolean
    terminated?: boolean
  }
  createdAt?: string
}

type AssignProviderRequest = {
  clientId: string
  userId: string[]
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }

  return fallback
}

function buildFullName(item: ProviderApiItem): string {
  const explicitFullName =
    item.fullName?.trim() ?? item.user?.fullName?.trim() ?? ""

  if (explicitFullName) {
    return explicitFullName
  }

  const firstName = item.firstName ?? item.user?.firstName ?? ""
  const lastName = item.lastName ?? item.user?.lastName ?? ""

  return [firstName, lastName].filter(Boolean).join(" ").trim()
}

function normalizeProvider(item: ProviderApiItem): ClientProvider {
  const userId = item.userId ?? item.memberUserId ?? item.user?.id ?? ""

  return {
    id: item.id ?? item.clientProviderId ?? item.providerId ?? userId,
    clientId: item.clientId ?? "",
    userId,
    fullName: buildFullName(item),
    roleName: item.roleName ?? item.role?.name ?? item.user?.roleName ?? item.user?.role?.name ?? "",
    active: toBoolean(item.active ?? item.user?.active, true),
    terminated: toBoolean(item.terminated ?? item.user?.terminated, false),
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

  const wrapped = data as { data?: unknown; entities?: unknown }
  if (Array.isArray(wrapped.data)) {
    return (wrapped.data as ProviderApiItem[]).map(normalizeProvider)
  }

  if (Array.isArray(wrapped.entities)) {
    return (wrapped.entities as ProviderApiItem[]).map(normalizeProvider)
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

export async function assignProvider(data: AssignProviderDto): Promise<string | null> {
  const payload: AssignProviderRequest = {
    clientId: data.clientId,
    userId: Array.isArray(data.userId) ? data.userId : [data.userId],
  }

  const response = await servicePost<AssignProviderRequest, unknown>("/client/provider", payload)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    const err = response.data as { message?: string } | undefined
    throw new Error(err?.message || "Failed to assign provider")
  }

  return typeof response.data === "string" ? response.data : null
}

export async function removeProvider(providerId: string): Promise<void> {
  const response = await serviceDelete<void>(`/client/provider/${providerId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to remove provider")
  }
}
