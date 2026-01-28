import { serviceGet } from "@/lib/services/baseService"
import type { Agreement, AgreementsResponse } from "@/lib/types/agreement.types"

export async function getAgreements(): Promise<{ agreements: Agreement[], totalCount: number }> {
  const response = await serviceGet<AgreementsResponse>("/company/agreements")

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch agreements")
  }

  const data = response.data
  
  // Transformar el objeto en array de agreements
  const agreements: Agreement[] = []
  
  if (data.businessAgreement) {
    agreements.push({
      id: "business-agreement",
      name: "Business Agreement",
      documentUrl: data.businessAgreement
    })
  }
  
  if (data.serviceAgreement) {
    agreements.push({
      id: "service-agreement",
      name: "Service Agreement",
      documentUrl: data.serviceAgreement
    })
  }

  return {
    agreements,
    totalCount: agreements.length
  }
}
