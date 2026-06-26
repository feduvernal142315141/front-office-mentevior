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

export interface ClientServicePlanItemBaseline {
  id: string
  date: string
  value: number
  periodCatalogId: string
  environmentalChanges?: string
  show: boolean
}

export interface ClientServicePlanItemObjective {
  id: string
  name: string
  startDate: string
  estimatedEndDate: string | null
  endDate: string
  operatorSmartCriteria: string
  valueSmartCriteria: number
  periodSmartCriteriaCatalogId: string
  valueDuration: number
  periodDurationCatalogId: string
}

export interface ClientServicePlanItemDataCollection {
  typeEventCatalogId: string
  unitMeasurementCatalogId: string | null
  dailyValue: string
  weeklyValue: string
  unitOfTime: string
  recordingsNumber: number
  intervalLength: number
  levels: unknown[]
}

export interface ClientServicePlanItemChart {
  id: string
  interval: string
  titleXAxes: string
  positionXAxes: string
  hideGridXAxes: boolean
  titleYAxes: string
  positionYAxes: string
  hideGridYAxes: boolean
  suggestedMinYAxes: number
  suggestedMaxYAxes: number
  showLabelObjectives: boolean
  showLineObjectives: boolean
  showBackgroundObjectives: boolean
  fontColorObjectives: string
  borderColorObjectives: string
  backgroundColorObjectives: string
  lineTypeObjectives: string
  datasetCatalogIds: string[]
  datasets: unknown[]
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
  teachingMethodId?: string | null
  baseline?: ClientServicePlanItemBaseline[]
  objetive?: ClientServicePlanItemObjective[]
  dataCollection?: ClientServicePlanItemDataCollection | null
  chart?: ClientServicePlanItemChart | null
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
