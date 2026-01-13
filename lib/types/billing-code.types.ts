export type BillingCodeType = "CPT" | "HCPCS"

export interface BillingCodeTypeItem {
  id: string
  name: BillingCodeType
  code: string
}

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
  typeId: string  // GUID del tipo (CPT o HCPCS)
  code: string
  modifiers?: string 
  parent?: string
  placeServiceId?: string  // GUID del place of service
  description: string
}

export interface UpdateBillingCodeDto {
  id: string  // GUID del billing code a actualizar
  typeId: string  // GUID del tipo (CPT o HCPCS)
  code: string
  modifiers?: string  
  parent?: string  
  placeServiceId?: string  // GUID del place of service
  description: string
}
