import { serviceGetSilent } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"

/** A billing code item from the approved prior authorization */
export interface ApprovedBillingCodeItem {
  id: string
  name: string
  modifier: string
  type: string
  availableUnit: number
}

/** Response from GET /prior-authorizations/approved-billing-codes/by-client/{clientId} */
export interface ApprovedBillingCodesResponse {
  id: string
  insuranceId: string
  insuranceMemberNumber: string
  primaryDiagnosisId: string
  primaryDiagnosisCode: string
  authNumber: string
  startDate: string
  endDate: string
  durationInterval: "DAYS" | "WEEKS" | "MONTHS"
  requestDate: string | null
  responseDate: string | null
  active: boolean
  billingCodes: ApprovedBillingCodeItem[]
}

export async function getApprovedBillingCodesByClient(
  clientId: string,
  billingCodeType: string = "Session",
  providerId?: string,
): Promise<ApprovedBillingCodesResponse | null> {
  const params = new URLSearchParams({ billingCodeType })
  if (providerId) params.set("providerId", providerId)
  const url = `/prior-authorizations/approved-billing-codes/by-client/${clientId}?${params.toString()}`
  const response = await serviceGetSilent<ApprovedBillingCodesResponse | null>(url)

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load approved billing codes"))
  }

  // API returns null when no active prior authorization exists
  if (response.data === null || response.data === undefined) {
    return null
  }

  return response.data as unknown as ApprovedBillingCodesResponse
}
