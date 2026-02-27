import apiInstance from "@/lib/services/apiConfig"

export interface GenderCatalogItem {
  id: string
  name: string
}

interface GenderCatalogResponse {
  entities: GenderCatalogItem[]
}

export async function getGenderCatalog(): Promise<GenderCatalogItem[]> {
  const response = await apiInstance.get<GenderCatalogResponse>("/gender/catalog")
  return response.data.entities
}
