import { servicePostSilent } from "@/lib/services/baseService"
import { getApiErrorMessage } from "@/lib/utils/api-error-message"
import type { ImproveAppointmentNoteSummaryPayload } from "@/lib/types/appointment-note-ai-summary.types"

/**
 * Ask Bedrock to rewrite a session note narrative from the current draft + clinical metadata.
 * POST /ai/bedrock/appointment-note/improve-summary
 * Silent: caller shows its own toast so a failed AI suggestion doesn't duplicate the
 * global error notification.
 */
export async function improveAppointmentNoteSummary(
  payload: ImproveAppointmentNoteSummaryPayload,
): Promise<string> {
  const response = await servicePostSilent<ImproveAppointmentNoteSummaryPayload, { suggestedSummary?: string }>(
    "/ai/bedrock/appointment-note/improve-summary",
    payload,
  )

  if (response.status !== 200) {
    throw new Error(getApiErrorMessage(response?.data, "Failed to improve summary"))
  }

  const data = response.data as unknown as Record<string, unknown>
  const suggested = data?.suggestedSummary ?? (data as { entity?: { suggestedSummary?: string } })?.entity?.suggestedSummary
  if (typeof suggested !== "string") {
    throw new Error("The AI suggestion was empty")
  }
  return suggested
}
