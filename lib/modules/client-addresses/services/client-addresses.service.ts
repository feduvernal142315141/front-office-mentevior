import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import { parseProgressOrNull, parseProgressOrZero } from "@/lib/utils/progress"
import type { MutationResult, PaginatedResponse, UpdateMutationResult } from "@/lib/types/response.types"
import type {
  ClientAddress,
  CreateClientAddressByCompanyAddressIdDto,
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
  canEdit?: boolean
  can_edit?: boolean
  createdAt?: string
  placeServiceName?: string
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
    canEdit: item.canEdit === true || item.can_edit === true,
    createdAt: item.createdAt,
    placeServiceName: item.placeServiceName ?? "",
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

export async function getClientAddressById(id: string): Promise<ClientAddress | null> {
  const response = await serviceGet<ClientAddressApiItem>(`/client/address/${id}`)

  if (response.status === 404) return null

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch address")
  }

  return normalizeClientAddress(response.data as ClientAddressApiItem)
}

export async function createClientAddress(data: CreateClientAddressDto): Promise<MutationResult> {
  const payload = toApiPayload(data)
  const response = await servicePost<typeof payload, number>("/client/address", payload)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create address")
  }

  return { progress: parseProgressOrZero(response.data) }
}

export async function createClientAddressByCompanyAddressId(
  data: CreateClientAddressByCompanyAddressIdDto,
): Promise<MutationResult> {
  const response = await servicePost<
    { clientId: string; companyAddressId: string; isPrimary: boolean },
    number
  >("/client/address-by-company-address-id", {
    clientId: data.clientId,
    companyAddressId: data.companyAddressId,
    isPrimary: data.isPrimary,
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create address from company address")
  }

  return { progress: parseProgressOrZero(response.data) }
}

export async function updateClientAddress(data: UpdateClientAddressDto): Promise<UpdateMutationResult> {
  const payload = toApiPayload(data) as UpdateClientAddressPayload
  const response = await servicePut<UpdateClientAddressPayload, number>("/client/address", payload)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update address")
  }

  return { progress: parseProgressOrNull(response.data) }
}

export async function deleteClientAddress(id: string): Promise<number> {
  const response = await serviceDelete<number>(`/client/address/${id}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete address")
  }

  return parseProgressOrZero(response.data)
}
