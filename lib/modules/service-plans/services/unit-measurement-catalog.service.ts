import { serviceGet } from "@/lib/services/baseService"

export interface UnitMeasurementCatalogItem {
  id: string
  name: string
  group: string
}

interface UnitMeasurementCatalogResponse {
  entities: UnitMeasurementCatalogItem[]
  pagination: { page: number; pageSize: number; total: number }
}

export async function getUnitMeasurementCatalog(): Promise<UnitMeasurementCatalogItem[]> {
  const response = await serviceGet<UnitMeasurementCatalogResponse>("/unit-measurement/catalog")
  return response?.data?.entities ?? []
}
