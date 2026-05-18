import { serviceGet } from "@/lib/services/baseService"

export interface TypeEventCatalogItem {
  id: string
  name: string
  group: string
}

interface TypeEventCatalogResponse {
  entities: TypeEventCatalogItem[]
  pagination: { page: number; pageSize: number; total: number }
}

export async function getTypeEventCatalog(): Promise<TypeEventCatalogItem[]> {
  const response = await serviceGet<TypeEventCatalogResponse>("/type-event/catalog")
  return response?.data?.entities ?? []
}
