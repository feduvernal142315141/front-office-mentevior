export interface ClientAddress {
  id: string
  clientId: string
  nickName: string
  placeServiceId?: string
  placeService?: string
  addressLine1: string
  apartmentSuite?: string
  city: string
  state: string
  stateId?: string
  zipCode: string
  country: string
  countryId?: string
  isPrimary: boolean
  active: boolean
  createdAt?: string
  placeServiceName?: string
}

export interface CreateClientAddressDto {
  clientId: string
  nickName: string
  placeServiceId?: string
  addressLine1: string
  apartmentSuite?: string
  city: string
  stateId?: string
  state?: string
  zipCode: string
  countryId?: string
  country?: string
  isPrimary?: boolean
  sourceAddressId?: string
  sourceClientId?: string
  placeServiceName?: string
}

export interface CreateClientAddressByCompanyAddressIdDto {
  clientId: string
  companyAddressId: string
  isPrimary: boolean
}

export interface UpdateClientAddressDto {
  id: string
  nickName?: string
  placeServiceId?: string
  addressLine1?: string
  apartmentSuite?: string
  city?: string
  stateId?: string
  state?: string
  zipCode?: string
  countryId?: string
  country?: string
  isPrimary?: boolean
  active?: boolean
}
