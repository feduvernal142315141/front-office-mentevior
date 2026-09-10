/** PUT /client-data-collection — request body */
export interface UpsertClientDataCollectionDto {
  clientServicePlanCategoryItemId: string
  appointmentId: string | null
  date: string
  value: number
  environmentalChange?: string | null
}

/** GET /client-data-collection — query params */
export interface ClientDataCollectionQuery {
  clientServicePlanCategoryItemId: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
}

/** GET /client-data-collection — response item */
export interface ClientDataCollectionRecord {
  id: string
  appointmentId: string
  clientServicePlanCategoryItemId: string
  value: number
  date: string // YYYY-MM-DD
  appointmentStatusId?: string
  appointmentStatusName?: string
  environmentalChange?: string | null
}

/**
 * GET /client-data-collection/by-category-id/{categoryId}
 * Un grupo por item no eliminado de la categoría; el itemId no se repite
 * dentro de cada registro del array `dataCollection`.
 */
export interface ClientDataCollectionByItemGroup {
  clientServicePlanCategoryItemId: string
  dataCollection: ClientDataCollectionRecord[]
}
