import type {
  DataCollectionConfig,
  ItemDataCollectionConfig,
  UpsertCategoryDataCollectionDto,
  UpsertItemDataCollectionDto,
} from "@/lib/types/data-collection.types"

// --- Mock in-memory store ---
const categoryConfigStore = new Map<string, DataCollectionConfig>()
const itemConfigStore = new Map<string, ItemDataCollectionConfig>()

// Simulate network delay
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// --- Category-level ---

export async function getCategoryDataCollection(
  categoryId: string
): Promise<DataCollectionConfig | null> {
  await delay()
  return categoryConfigStore.get(categoryId) ?? null
}

export async function upsertCategoryDataCollection(
  dto: UpsertCategoryDataCollectionDto
): Promise<void> {
  await delay(400)
  const config: DataCollectionConfig = {
    id: categoryConfigStore.get(dto.servicePlanCategoryId)?.id ?? crypto.randomUUID(),
    type: dto.type,
    weeklyDailyValue: dto.weeklyDailyValue,
    levels: dto.levels.map((l) => ({ ...l, id: crypto.randomUUID() })),
    intervalLength: dto.intervalLength,
    unitOfTime: dto.unitOfTime,
    suggestedNumberOfRecordings: dto.suggestedNumberOfRecordings,
    cumulative: dto.cumulative,
  }
  categoryConfigStore.set(dto.servicePlanCategoryId, config)
}

export async function hasCategoryDataCollection(
  categoryId: string
): Promise<boolean> {
  await delay(100)
  return categoryConfigStore.has(categoryId)
}

// --- Item-level ---

export async function getItemDataCollection(
  itemId: string
): Promise<ItemDataCollectionConfig | null> {
  await delay()
  return itemConfigStore.get(itemId) ?? null
}

export async function upsertItemDataCollection(
  dto: UpsertItemDataCollectionDto
): Promise<void> {
  await delay(400)
  const config: ItemDataCollectionConfig = {
    id: itemConfigStore.get(dto.itemId)?.id ?? crypto.randomUUID(),
    type: dto.type,
    weeklyDailyValue: dto.weeklyDailyValue,
    levels: dto.levels.map((l) => ({ ...l, id: crypto.randomUUID() })),
    intervalLength: dto.intervalLength,
    unitOfTime: dto.unitOfTime,
    suggestedNumberOfRecordings: dto.suggestedNumberOfRecordings,
    cumulative: dto.cumulative,
    itemId: dto.itemId,
    itemName: "",
    categoryId: dto.servicePlanCategoryId,
    categoryName: "",
    topography: dto.topography,
    active: dto.active,
    isCustomOverride: true,
  }
  itemConfigStore.set(dto.itemId, config)
}

export async function hasItemCustomDataCollection(
  itemId: string
): Promise<boolean> {
  await delay(100)
  return itemConfigStore.has(itemId)
}
