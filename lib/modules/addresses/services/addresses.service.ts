import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"
import type { Address, AddressListItem, CreateAddressDto, UpdateAddressDto, Country, State, PlaceOfService } from "@/lib/types/address.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"


export async function getAddresses(query: QueryModel): Promise<{ addresses: AddressListItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<AddressListItem>>(`/company-address${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch addresses")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<AddressListItem>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { addresses: [], totalCount: 0 }
  }
  
  return {
    addresses: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}


export async function getAddressById(addressId: string): Promise<Address | null> {
  const response = await serviceGet<Address>(`/company-address/${addressId}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch address")
  }

  return response.data as unknown as Address
}


export async function createAddress(data: CreateAddressDto): Promise<string> {
  const response = await servicePost<CreateAddressDto, string>("/company-address", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create address")
  }

  return response.data as unknown as string
}


export async function updateAddress(data: UpdateAddressDto): Promise<boolean> {
  const response = await servicePut<UpdateAddressDto, boolean>("/company-address", data)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update address")
  }

  return response.data as unknown as boolean
}

export async function deleteAddress(id: string): Promise<boolean> {
  const response = await serviceDelete<boolean>(`/company-address/${id}`)

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to delete credential")
  }

  return true
}


export async function getCountries(): Promise<Country[]> {
  const response = await serviceGet<PaginatedResponse<Country>>("/country")
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch countries")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<Country>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return paginatedData.entities
}


export async function getStatesByCountry(countryId: string): Promise<State[]> {
  const response = await serviceGet<PaginatedResponse<State>>(`/state/${countryId}`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch states")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<State>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return paginatedData.entities
}

/**
 * Get place of service catalog
 */
export async function getPlacesOfService(): Promise<PlaceOfService[]> {
  const response = await serviceGet<PaginatedResponse<PlaceOfService>>("/place-service/catalog")
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch places of service")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<PlaceOfService>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return []
  }

  return paginatedData.entities
}
