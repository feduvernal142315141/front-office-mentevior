export interface CompanyServicePlan {
  id: string
  serviceId: string
  serviceName: string
  name: string
  description: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}

export interface ServicePlanCategorySummary {
  id: string
  categoryId: string
  categoryName: string
  totalItems: number
}

export interface ServicePlanCategoryMappedItem {
  id: string
  itemId: string
  itemName: string
  description?: string
  active?: boolean
  order?: number
}

export interface ItemCatalogItem {
  id: string
  categoryId: string
  name: string
}

export interface AssignItemsToServicePlanCategoryPayload {
  itemIds: string[]
}

export interface CreateCompanyServicePlanDto {
  serviceId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}

export interface UpdateCompanyServicePlanDto {
  id: string
  serviceId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}
