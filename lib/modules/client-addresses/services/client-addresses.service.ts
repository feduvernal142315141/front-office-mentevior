import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type { PaginatedResponse } from "@/lib/types/response.types"
import type {
  ClientAddress,
  CreateClientAddressDto,
  UpdateClientAddressDto,
} from "@/lib/types/client-address.types"

type ClientAddressApiItem = {
  id?: string
  clientId?: string
  nickName?: string
  placeServiceId?: string
  placeService?: string
  placeOfService?: string
  addressLine1?: string
  address?: string
  apartmentSuite?: string
  apartment?: string
  suite?: string
  city?: string
  state?: string
  stateId?: string
  zipCode?: string
  country?: string
  countryId?: string
  isPrimary?: boolean
  isPrincipal?: boolean
  active?: boolean
  createdAt?: string
}

type UpdateClientAddressPayload = Omit<UpdateClientAddressDto, "id"> & { id: string }

function normalizeClientAddress(item: ClientAddressApiItem): ClientAddress {
  return {
    id: item.id ?? "",
    clientId: item.clientId ?? "",
    nickName: item.nickName ?? "",
    placeServiceId: item.placeServiceId,
    placeService: item.placeService ?? item.placeOfService,
    addressLine1: item.addressLine1 ?? item.address ?? "",
    apartmentSuite: item.apartmentSuite ?? item.apartment ?? item.suite,
    city: item.city ?? "",
    state: item.state ?? "",
    stateId: item.stateId,
    zipCode: item.zipCode ?? "",
    country: item.country ?? "",
    countryId: item.countryId,
    isPrimary: item.isPrimary ?? item.isPrincipal ?? false,
    active: item.active ?? true,
    createdAt: item.createdAt,
  }
}

function normalizeClientAddressesResponse(data: unknown): ClientAddress[] {
  if (!data) return []

  if (Array.isArray(data)) {
    return data.map((item) => normalizeClientAddress(item as ClientAddressApiItem))
  }

  const paginated = data as PaginatedResponse<ClientAddress>
  if (Array.isArray(paginated.entities)) {
    return paginated.entities.map((item) => normalizeClientAddress(item as ClientAddressApiItem))
  }

  const wrapped = data as { data?: unknown; entities?: unknown }
  if (Array.isArray(wrapped.data)) {
    return (wrapped.data as ClientAddressApiItem[]).map(normalizeClientAddress)
  }

  if (Array.isArray(wrapped.entities)) {
    return (wrapped.entities as ClientAddressApiItem[]).map(normalizeClientAddress)
  }

  return []
}

function toApiPayload(data: CreateClientAddressDto | UpdateClientAddressDto) {
  return {
    ...data,
    address: (data as CreateClientAddressDto).addressLine1 ?? (data as UpdateClientAddressDto).addressLine1,
    isPrincipal: (data as CreateClientAddressDto).isPrimary ?? (data as UpdateClientAddressDto).isPrimary,
  }
}

export async function getClientAddressesByClientId(clientId: string): Promise<ClientAddress[]> {
  const response = await serviceGet<PaginatedResponse<ClientAddress>>(`/client/addresses/${clientId}`)

  if (response.status === 404) return []

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch addresses")
  }

  return normalizeClientAddressesResponse(response.data)
}

export async function createClientAddress(data: CreateClientAddressDto): Promise<string> {
  const payload = toApiPayload(data)
  const response = await servicePost<typeof payload, string>("/client/address", payload)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create address")
  }

  return response.data as string
}

export async function updateClientAddress(data: UpdateClientAddressDto): Promise<string> {
  const payload = toApiPayload(data) as UpdateClientAddressPayload
  const response = await servicePut<UpdateClientAddressPayload, string>("/client/address", payload)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update address")
  }

  return response.data as string
}
