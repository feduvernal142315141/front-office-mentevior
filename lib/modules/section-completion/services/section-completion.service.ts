import { serviceGet } from "@/lib/services/baseService"
import type { SectionCompletionMap } from "@/lib/types/section-completion.types"

export async function getSectionCompletion(): Promise<SectionCompletionMap> {
  const response = await serviceGet<SectionCompletionMap>("/company/setup-status")

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch section completion status")
  }

  return response.data as unknown as SectionCompletionMap
}
