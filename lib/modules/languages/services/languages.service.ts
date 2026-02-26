import apiInstance from "@/lib/services/apiConfig"

export interface LanguageCatalogItem {
  id: string
  name: string
}

interface LanguageCatalogResponse {
  entities: LanguageCatalogItem[]
}

export async function getLanguagesCatalog(): Promise<LanguageCatalogItem[]> {
  const response = await apiInstance.get<LanguageCatalogResponse>("/language/catalog")
  return response.data.entities
}
