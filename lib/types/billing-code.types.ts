export type BillingCodeType = string

export interface BillingCodeTypeItem {
  id: string
  name: string
  code: string
}

export interface BillingCode {
  id: string
  type: BillingCodeType
  code: string
  description: string
  modifier?: string
  parent?: string
  allowedPlacesOfService?: string[]
  active: boolean
  isFromCatalog?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface BillingCodeListItem {
  id: string
  type: BillingCodeType
  code: string
  description: string
  modifier?: string
  active: boolean
  isFromCatalog?: boolean
}

export interface BillingCodeCatalogItem {
  id: string
  type: BillingCodeType
  code: string
  description: string
  modifier?: string
}

export interface CreateBillingCodeDto {
  typeId: string  
  code: string
  modifiers?: string 
  parent?: string
  placeServiceId?: string  
  description: string
}

export interface UpdateBillingCodeDto {
  id: string  
  typeId: string  
  code: string
  modifiers?: string  
  parent?: string  
  placeServiceId?: string  
  description: string
}
