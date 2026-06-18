import { servicePost } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type {
  ValidateEventDataRequest,
  ValidateEventDataResponse,
} from "@/lib/types/appointment.types"

export async function validateAppointmentEventData(
  payload: ValidateEventDataRequest,
): Promise<ValidateEventDataResponse> {
  const response = await servicePost<ValidateEventDataRequest, ValidateEventDataResponse>(
    "/appointment/validate-event-data",
    payload,
  )

  if (response.status !== 200 || !response.data) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to validate appointment data"))
  }

  return response.data as unknown as ValidateEventDataResponse
}
