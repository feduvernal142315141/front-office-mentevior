import {
  ServicePlanUnitOfTime,
  ServicePlanValueType,
} from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import type { ChartConfig } from "@/lib/modules/service-plans/constants/chart.constants"
import type { RecommendationsConfig } from "@/lib/types/client-service-plan.types"

export { ServicePlanUnitOfTime, ServicePlanValueType }

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

export enum OperatorSmartCriteria {
  GT = "GT",
  GTE = "GTE",
  EQ = "EQ",
  LT = "LT",
  LTE = "LTE",
}

export const OPERATOR_SMART_CRITERIA_OPTIONS: { value: string; label: string }[] = [
  { value: OperatorSmartCriteria.GT, label: ">" },
  { value: OperatorSmartCriteria.GTE, label: ">=" },
  { value: OperatorSmartCriteria.EQ, label: "=" },
  { value: OperatorSmartCriteria.LT, label: "<" },
  { value: OperatorSmartCriteria.LTE, label: "<=" },
]

export type ObjectiveStatus = "not_started" | "in_progress" | "mastered"

export interface DataCollectionObjectiveData {
  recordId?: string
  name: string
  startDate: string
  estimatedEndDate: string
  endDate: string
  operatorSmartCriteria: string
  valueSmartCriteria: number
  periodSmartCriteriaCatalogId: string
  valueDuration: number
  periodDurationCatalogId: string
}

export interface DataCollectionBaselineData {
  recordId?: string
  date: string
  value: number
  periodCatalogId: string
  comments: string
  show: boolean
}

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
  chart?: ChartConfig
  baselines?: DataCollectionBaselineData[]
  objectives?: DataCollectionObjectiveData[]
  recommendations?: RecommendationsConfig
}

export interface CategoryDataCollectionConfig extends DataCollectionConfig {
  categoryId: string
  categoryName: string
}

export interface ItemDataCollectionConfig extends DataCollectionConfig {
  itemId: string
  itemName: string
  categoryId: string
  categoryName: string
  topography: string
  active: boolean
  isCustomOverride?: boolean
}

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
  chart?: ChartConfig
}

export interface UpsertItemDataCollectionDto {
  servicePlanCategoryItemId: string
  name?: string
  topography: string
  active: boolean
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
  chart?: ChartConfig
}

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
