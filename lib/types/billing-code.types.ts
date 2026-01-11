export type BillingCodeType = "CPT" | "HCPCS"

export interface BillingCode {
  id: string
  type: BillingCodeType
  code: string
  description: string
  modifiers?: string[]
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
  modifiers?: string[]
  active: boolean
  isFromCatalog?: boolean
}

export interface BillingCodeCatalogItem {
  id: string
  type: BillingCodeType
  code: string
  description: string
}

export interface CreateBillingCodeDto {
  typeId: string  
  code: string
  modifiers: string 
  parent?: string
  placeServiceId?: string  
  description: string
}

export interface UpdateBillingCodeDto {
  id: string
  typeId: string  
  code: string
  modifiers: string  
  parent?: string  
  placeServiceId?: string
  description: string
}
