
export interface Address {
  id: string
  nickName: string
  placeServiceId: string
  placeService?: string  
  city: string
  address: string
  zipCode: string
  country: string    
  state: string      
  countryId?: string 
  stateId?: string   
  startDate: string
  endDate?: string
  active: boolean
}
export interface AddressListItem {
  id: string
  nickName: string
  placeService?: string
  city: string
  address: string
  zipCode: string
  country: string
  state: string
  active: boolean
  startDate: string
  isPrincipal: boolean
}

export interface CreateAddressDto {
  nickName: string
  placeServiceId: string
  stateId: string
  city: string
  address: string
  zipCode: string
  //startDate: string
  //endDate?: string
  //active: boolean
}

export interface UpdateAddressDto {
  id: string
  nickName: string
  placeServiceId: string
  stateId: string
  city: string
  address: string
  zipCode: string
  //startDate: string
  //endDate?: string
  //active: boolean
}

export interface Country {
  id: string
  name: string
}

export interface State {
  id: string
  name: string
  countryId: string
}

export interface PlaceOfService {
  id: string
  name: string
  code?: string
}
