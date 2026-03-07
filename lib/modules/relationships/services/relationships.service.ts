import apiInstance from "@/lib/services/apiConfig"

export interface RelationshipCatalogItem {
  id: string
  name: string
}

interface RelationshipCatalogResponse {
  entities: RelationshipCatalogItem[]
}

export async function getRelationshipCatalog(): Promise<RelationshipCatalogItem[]> {
  const response = await apiInstance.get<RelationshipCatalogResponse>("/relationship/catalog")
  return response.data.entities
}
