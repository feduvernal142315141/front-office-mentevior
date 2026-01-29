import { serviceGet } from "@/lib/services/baseService"
import type { AgreementListItem } from "@/lib/types/agreement.types"
import type { PaginatedResponse } from "@/lib/types/response.types"

export async function getAgreements(): Promise<{ agreements: AgreementListItem[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<AgreementListItem>>("/company/agreements")

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch agreements")
  }

  const paginatedData = response.data as unknown as PaginatedResponse<AgreementListItem>

  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { agreements: [], totalCount: 0 }
  }

  return {
    agreements: paginatedData.entities,
    totalCount: paginatedData.pagination?.total || 0
  }
}
