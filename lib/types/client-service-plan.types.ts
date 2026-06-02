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

/** Shape returned by the GET /client-service-plan-category-item/{id}/level → recommendation */
export interface ApiRecommendationItem {
  id: string
  name: string
}

/** Parsed recommendations stored in DataCollectionConfig (form-ready: just IDs). */
export interface RecommendationsConfig {
  strategyId: string
  activitiesToOccurrence: string[]
  preventiveStrategies: string[]
  replacements: string[]
  interventions: string[]
  reinforcers: string[]
}

/** PUT payload shape nested under "recommendation" key. null = empty. */
export interface ApiRecommendationsPayload {
  strategyId: string | null
  activitiesToOccurrence: string[] | null
  preventiveStrategies: string[] | null
  replacements: string[] | null
  interventions: string[] | null
  reinforcers: string[] | null
}
