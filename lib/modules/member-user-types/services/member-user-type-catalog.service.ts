import { serviceGet } from "@/lib/services/baseService"
import type { MemberUserTypeCatalogItem } from "@/lib/types/user.types"

export async function getMemberUserTypeCatalog(): Promise<MemberUserTypeCatalogItem[]> {
  const response = await serviceGet<MemberUserTypeCatalogItem[]>("/member-user-type/catalog")

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch member user type catalog")
  }

  const data = response.data as unknown
  if (Array.isArray(data)) return data as MemberUserTypeCatalogItem[]

  const paginated = data as { entities?: MemberUserTypeCatalogItem[] }
  return Array.isArray(paginated.entities) ? paginated.entities : []
}
