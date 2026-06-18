import { serviceGet } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type { ConfigBillingCodeItem, EventType } from "@/lib/types/appointment.types"

export type AppointmentBillingCodeContext = EventType | "supervision"

const ENDPOINT_BY_CONTEXT: Record<AppointmentBillingCodeContext, string> = {
  session_note: "/appointment_config/billing-codes",
  service_plan: "/service-plan-config/billing-codes",
  supervision: "/supervision-config/billing-codes",
}

export async function getAppointmentBillingCodes(
  context: AppointmentBillingCodeContext,
): Promise<ConfigBillingCodeItem[]> {
  const url = ENDPOINT_BY_CONTEXT[context]
  const response = await serviceGet<ConfigBillingCodeItem[]>(url)

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to load billing codes"))
  }

  const data = response.data as unknown
  return Array.isArray(data) ? data : []
}
