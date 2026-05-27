export interface ClientServicePlan {
  id: string
  clientId: string
  servicePlanId: string
  name: string
  description: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}

export interface ClientServicePlanCategorySummary {
  id: string
  categoryId: string
  categoryName: string
  canEdit?: boolean
  totalItems: number
  hasDataCollection?: boolean
}

export interface ClientServicePlanCategoryMappedItem {
  id: string
  itemId: string
  itemName: string
  canEdit?: boolean
  description?: string
  active?: boolean
  order?: number
  hasDataCollection?: boolean
  hasCustomDataCollection?: boolean
}

export interface ClientItemCatalogItem {
  id: string
  categoryId: string
  name: string
  canEdit?: boolean
}

export interface AssignItemsToClientServicePlanCategoryDto {
  clientServicePlanCategoryId: string
  itemIds: string[]
}

export interface UpdateClientServicePlanDto {
  id: string
  clientId: string
  name: string
  startDate?: string
  endDate?: string
  description?: string
  active: boolean
  categories: string[]
}

// --- Recommendations Types ---

export interface RecommendationCatalogItem {
  id: string
  name: string
  group?: string
}

export interface RecommendationSelection {
  catalogItemId: string
  catalogItemName: string
  customText?: string
}

export interface ItemRecommendations {
  strategies: string[]
  activitiesImplemented: RecommendationSelection[]
  preventiveStrategies: RecommendationSelection[]
  replacements: string[]
  interventions: RecommendationSelection[]
  reinforcers: string[]
}
