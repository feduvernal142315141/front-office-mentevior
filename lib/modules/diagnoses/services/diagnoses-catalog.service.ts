import { serviceGet } from "@/lib/services/baseService"
import type { DiagnosisCatalogItem } from "@/lib/types/diagnosis-catalog.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

export async function getDiagnosisCatalog(
  query: QueryModel,
): Promise<{ items: DiagnosisCatalogItem[]; totalCount: number }> {
  const qs = query ? getQueryString(query) : ""
  const response = await serviceGet<PaginatedResponse<DiagnosisCatalogItem>>(
    `/diagnosis-code/catalog${qs ? `?${qs}` : ""}`,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(
      (response.data as { message?: string } | undefined)?.message ??
        "Failed to fetch diagnosis catalog",
    )
  }

  const paginated = response.data as unknown as PaginatedResponse<DiagnosisCatalogItem>

  if (!paginated.entities || !Array.isArray(paginated.entities)) {
    return { items: [], totalCount: paginated.pagination?.total ?? 0 }
  }

  return {
    items: paginated.entities,
    totalCount: paginated.pagination?.total ?? paginated.entities.length,
  }
}
