import { serviceGet } from "@/lib/services/baseService"
import type { SectionCompletionMap } from "@/lib/types/section-completion.types"

const API_KEY_TO_HREF: Record<string, string> = {
  service: "/my-company/services",
  servicePlan: "/my-company/service-plans",
  billingCode: "/my-company/billing",
  credentials: "/my-company/credentials",
  physician: "/my-company/physicians",
  payers: "/my-company/billing",
  clinicalDocument: "/my-company/documents",
  hrDocument: "/my-company/documents",
}

export async function getSectionCompletion(): Promise<SectionCompletionMap> {
  const response = await serviceGet<Record<string, boolean>>("/company/setup-status")

  if (response.status !== 200 || !response.data) {
    throw new Error("Failed to fetch section completion status")
  }

  const apiData = response.data as Record<string, boolean>
  const mapped: SectionCompletionMap = {}

  for (const [apiKey, value] of Object.entries(apiData)) {
    const href = API_KEY_TO_HREF[apiKey]
    if (!href) continue

    // Key original del API para las cards individuales
    mapped[apiKey] = value

    // Key agrupada por href para el sidebar
    if (href in mapped) {
      mapped[href] = mapped[href] && value
    } else {
      mapped[href] = value
    }
  }

  return mapped
}
