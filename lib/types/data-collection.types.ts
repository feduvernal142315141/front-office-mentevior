import {
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"

export { ServicePlanUnitOfTime, ServicePlanValueType }

// --- Data Collection Type (UUID from /type-event/catalog) ---
export type DataCollectionType = string

export interface DataCollectionLevel {
  /** Client-only row key (React / form). Never sent to the API. */
  id: string
  /** Persisted level record id from GET. Omit on PUT for new / catalog rows. */
  recordId?: string
  label: string
  description: string
  value?: boolean
}

// --- Base config ---
export interface DataCollectionConfig {
  id?: string
  type: DataCollectionType | ""
  weeklyDailyValue?: ServicePlanValueType
  dailyValue?: ServicePlanValueType
  unitMeasurementCatalogId?: string
  levels: DataCollectionLevel[]
  intervalLength?: number
  unitOfTime?: ServicePlanUnitOfTime
  suggestedNumberOfRecordings?: number
  cumulative?: boolean
}

// --- Category-level config ---
export interface CategoryDataCollectionConfig extends DataCollectionConfig {
  categoryId: string
  categoryName: string
}

// --- Item-level config (extends with extra fields) ---
export interface ItemDataCollectionConfig extends DataCollectionConfig {
  itemId: string
  itemName: string
  categoryId: string
  categoryName: string
  topography: string
  active: boolean
  isCustomOverride?: boolean
}

// --- API DTOs ---
export interface UpsertCategoryDataCollectionDto {
  servicePlanCategoryId: string
  type: DataCollectionType
  weeklyDailyValue?: ServicePlanValueType
  dailyValue?: ServicePlanValueType
  unitMeasurementCatalogId?: string
  levels: Array<{
    id?: string
    label: string
    description: string
    value?: boolean
  }>
  intervalLength?: number
  unitOfTime?: ServicePlanUnitOfTime
  suggestedNumberOfRecordings?: number
  cumulative?: boolean
}

export interface UpsertItemDataCollectionDto extends UpsertCategoryDataCollectionDto {
  servicePlanCategoryItemId: string
  topography: string
  active: boolean
}

// --- Levels Library ---
export interface LevelsLibraryGroup {
  id: string
  name: string
  items: LevelsLibraryItem[]
}

export interface LevelsLibraryItem {
  id: string
  name: string
  abbreviation: string
}
