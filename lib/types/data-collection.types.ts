// --- Data Collection Type catalog (grouped) ---
export type DataCollectionTypeGroup =
  | "Event-recording"
  | "Time-sampling"
  | "Timing"
  | "Trial"
  | "Task-analysis"
  | "Log"

export type DataCollectionType =
  // Event-recording
  | "frequency"
  | "count"
  | "rate"
  // Time-sampling
  | "whole-interval"
  | "partial-interval"
  | "momentary-time-sampling"
  // Timing
  | "duration"
  | "response-latency"
  | "interresponse-time"
  // Trial
  | "discrete-trial-teaching"
  | "incident-teaching"
  | "percentage-of-opportunities"
  // Task-analysis
  | "forward-chaining"
  | "total-task-chaining"
  | "backward-chaining"
  | "backward-chaining-with-leaps-ahead"
  // Log
  | "measurement-log"

export type WeeklyDailyValue = "total" | "average"
export type UnitOfTime = "seconds" | "minutes" | "hours"

export interface DataCollectionLevel {
  id: string
  label: string
  description: string
  value?: boolean
}

// --- Base config ---
export interface DataCollectionConfig {
  id?: string
  type: DataCollectionType | ""
  weeklyDailyValue?: WeeklyDailyValue
  levels: DataCollectionLevel[]
  intervalLength?: number
  unitOfTime?: UnitOfTime
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
  weeklyDailyValue?: WeeklyDailyValue
  levels: Omit<DataCollectionLevel, "id">[]
  intervalLength?: number
  unitOfTime?: UnitOfTime
  suggestedNumberOfRecordings?: number
  cumulative?: boolean
}

export interface UpsertItemDataCollectionDto extends UpsertCategoryDataCollectionDto {
  itemId: string
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
