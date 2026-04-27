import { serviceGet, servicePut } from "@/lib/services/baseService"
import type {
  CompanyService,
  CompanyServiceListItem,
  ToggleCompanyServiceStatusDto,
} from "@/lib/types/company-service.types"

const DEFAULT_SERVICES: CompanyService[] = [
  {
    id: "aba-therapy",
    name: "ABA Therapy",
    description:
      "Applied Behavior Analysis (ABA) is a therapy based on the science of learning and behavior.",
    active: true,
    allowedCredentials: [
      { id: "rbt", name: "RBT" },
      { id: "lmhc", name: "LMHC" },
      { id: "bcba", name: "BCBA" },
      { id: "bcaba", name: "BCaBA" },
    ],
    allowedBillingCodes: [
      { id: "aba-97151", type: "CPT", code: "97151", description: "Behavior Identification Assessment" },
      { id: "aba-97151-ts", type: "CPT", code: "97151", modifier: "TS", description: "Behavior Identification Assessment" },
      { id: "aba-97155-hn", type: "CPT", code: "97155", modifier: "HN", description: "Adaptive Behavior Treatment with Protocol Modification" },
      { id: "aba-97156-hn", type: "CPT", code: "97156", modifier: "HN", description: "Family Adaptive Behavior Treatment Guidance" },
      { id: "aba-97153", type: "CPT", code: "97153", description: "Adaptive Behavior Treatment by Protocol" },
      { id: "aba-97153-xp", type: "CPT", code: "97153", modifier: "XP", description: "Adaptive Behavior Treatment by Protocol" },
      { id: "aba-97155-xp", type: "CPT", code: "97155", modifier: "XP", description: "Adaptive Behavior Treatment with Protocol Modification" },
      { id: "aba-97155", type: "CPT", code: "97155", description: "Adaptive Behavior Treatment with Protocol Modification" },
      { id: "aba-97156", type: "CPT", code: "97156", description: "Family Adaptive Behavior Treatment Guidance" },
      { id: "aba-97152", type: "CPT", code: "97152", description: "Behavior Identification Supporting Assessment" },
    ],
  },
  {
    id: "mental-health",
    name: "Mental Health",
    description:
      "Mental health includes our emotional, psychological, and social well-being. It affects how we think, feel, and act. It also helps determine how we handle stress, relate to others, and make choices.",
    active: false,
    allowedCredentials: [],
    allowedBillingCodes: [
      { id: "mh-h0031", type: "CPT", code: "H0031", description: "Mental Health Assessment" },
      { id: "mh-h0031-hn", type: "CPT", code: "H0031", modifier: "HN", description: "Mental Health Assessment" },
      { id: "mh-h0031-ho", type: "CPT", code: "H0031", modifier: "HO", description: "Mental Health Assessment" },
      { id: "mh-h0031-ts", type: "CPT", code: "H0031", modifier: "TS", description: "Mental Health Assessment" },
      { id: "mh-h0032", type: "CPT", code: "H0032", description: "Mental Health Service Plan Development" },
      { id: "mh-h0032-ts", type: "CPT", code: "H0032", modifier: "TS", description: "Mental Health Service Plan Development" },
      { id: "mh-h2000", type: "CPT", code: "H2000", description: "Comprehensive Multidisciplinary Evaluation" },
      { id: "mh-h2000-ho", type: "CPT", code: "H2000", modifier: "HO", description: "Comprehensive Multidisciplinary Evaluation" },
      { id: "mh-h2000-hp", type: "CPT", code: "H2000", modifier: "HP", description: "Comprehensive Multidisciplinary Evaluation" },
      { id: "mh-h2019-ho", type: "CPT", code: "H2019", modifier: "HO", description: "Therapeutic Behavioral Service" },
      { id: "mh-h2019-hq", type: "CPT", code: "H2019", modifier: "HQ", description: "Therapeutic Behavioral Service" },
      { id: "mh-h2019-hr", type: "CPT", code: "H2019", modifier: "HR", description: "Therapeutic Behavioral Service" },
      { id: "mh-h2030", type: "CPT", code: "H2030", description: "Mental Health Clubhouse Services" },
      { id: "mh-t1015", type: "CPT", code: "T1015", description: "Clinic Visit/Encounter" },
    ],
  },
]

let localServicesState: CompanyService[] = DEFAULT_SERVICES

function normalizeService(raw: unknown): CompanyService {
  const item = raw as Record<string, unknown>
  const credentialsRaw =
    (item.credentials as unknown[]) ??
    (item.allowedCredentials as unknown[]) ??
    (item.allowed_credentials as unknown[]) ??
    []
  const billingCodesRaw =
    (item.billingCodes as unknown[]) ??
    (item.allowedBillingCodes as unknown[]) ??
    (item.allowed_billing_codes as unknown[]) ??
    []

  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    description: String(item.description ?? ""),
    active: Boolean(item.active),
    allowedCredentials: Array.isArray(credentialsRaw)
      ? credentialsRaw.map((credential) => {
          const value = credential as Record<string, unknown>
          return {
            id: String(value.id ?? ""),
            name: String(value.name ?? value.shortName ?? value.short_name ?? ""),
          }
        })
      : [],
    allowedBillingCodes: Array.isArray(billingCodesRaw)
      ? billingCodesRaw.map((billingCode) => {
          const value = billingCode as Record<string, unknown>
          const rawModifier =
            value.modifier !== undefined && value.modifier !== null
              ? String(value.modifier).trim()
              : ""

          return {
            id: String(value.id ?? ""),
            type: String(value.type ?? value.typeName ?? value.type_name ?? "CPT"),
            code: String(value.code ?? ""),
            modifier: rawModifier.length > 0 ? rawModifier : undefined,
            description: String(value.description ?? ""),
          }
        })
      : [],
  }
}

function toListItem(service: CompanyService): CompanyServiceListItem {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    active: service.active,
    totalCredential: service.allowedCredentials.length,
    totalBillingCode: service.allowedBillingCodes.length,
    allowedCredentials: service.allowedCredentials,
    allowedBillingCodes: service.allowedBillingCodes,
  }
}

function parseTotalField(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseInt(value, 10)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

function isSummaryListRow(raw: unknown): boolean {
  const row = raw as Record<string, unknown>
  return (
    parseTotalField(row.totalCredential) !== undefined ||
    parseTotalField(row.totalBillingCode) !== undefined ||
    parseTotalField(row.total_credential) !== undefined ||
    parseTotalField(row.total_billing_code) !== undefined
  )
}

function normalizeListItem(raw: unknown): CompanyServiceListItem {
  const item = raw as Record<string, unknown>
  const totalCredential =
    parseTotalField(item.totalCredential) ??
    parseTotalField(item.total_credential) ??
    0
  const totalBillingCode =
    parseTotalField(item.totalBillingCode) ??
    parseTotalField(item.total_billing_code) ??
    0

  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    description: String(item.description ?? ""),
    active: Boolean(item.active),
    totalCredential,
    totalBillingCode,
    allowedCredentials: [],
    allowedBillingCodes: [],
  }
}

export async function getCompanyServices(): Promise<{
  services: CompanyServiceListItem[]
  totalCount: number
}> {
  try {
    const response = await serviceGet<CompanyService[] | { entities?: CompanyService[] }>("/service-company")
    if (response.status === 200 && response.data) {
      const rawServices = Array.isArray(response.data)
        ? response.data
        : Array.isArray((response.data as { entities?: unknown[] }).entities)
          ? ((response.data as { entities: unknown[] }).entities as unknown[])
          : []

      if (rawServices.length > 0) {
        const summaryList = isSummaryListRow(rawServices[0])
        if (summaryList) {
          const services = rawServices.map(normalizeListItem)
          return {
            services,
            totalCount: services.length,
          }
        }
        localServicesState = rawServices.map(normalizeService)
      }

      return {
        services: localServicesState.map(toListItem),
        totalCount: localServicesState.length,
      }
    }
  } catch {
    // Fallback to predefined catalog while backend endpoint is unavailable.
  }

  return {
    services: localServicesState.map(toListItem),
    totalCount: localServicesState.length,
  }
}

export async function getCompanyActiveServices(): Promise<{
  services: CompanyServiceListItem[]
  totalCount: number
}> {
  try {
    const response = await serviceGet<CompanyService[] | { entities?: CompanyService[] }>("/service-company/active-services")
    if (response.status === 200 && response.data) {
      const rawServices = Array.isArray(response.data)
        ? response.data
        : Array.isArray((response.data as { entities?: unknown[] }).entities)
          ? ((response.data as { entities: unknown[] }).entities as unknown[])
          : []

      if (rawServices.length > 0) {
        const summaryList = isSummaryListRow(rawServices[0])
        if (summaryList) {
          const services = rawServices.map(normalizeListItem)
          return {
            services,
            totalCount: services.length,
          }
        }

        const normalized = rawServices.map(normalizeService)
        return {
          services: normalized.map(toListItem),
          totalCount: normalized.length,
        }
      }
    }
  } catch {
    // No fallback: return empty list when endpoint fails.
  }

  return {
    services: [],
    totalCount: 0,
  }
}

export async function getCompanyServiceById(id: string): Promise<CompanyService | null> {
  try {
    const response = await serviceGet<CompanyService>(`/service-company/${id}`)
    if (response.status === 404) return null
    if (response.status !== 200 || !response.data) {
      throw new Error(response.data?.message || "Failed to fetch service details")
    }
    return normalizeService(response.data)
  } catch {
    return localServicesState.find((service) => service.id === id) ?? null
  }
}

export async function toggleCompanyServiceStatus(
  data: ToggleCompanyServiceStatusDto
): Promise<CompanyService | null> {
  try {
    const response = await servicePut<ToggleCompanyServiceStatusDto, CompanyService>(
      "/service-company/active",
      data
    )
    if ((response.status === 200 || response.status === 201) && response.data) {
      const updated = normalizeService(response.data)
      localServicesState = localServicesState.map((service) =>
        service.id === data.id ? { ...service, active: updated.active } : service
      )
      return updated
    }
  } catch {
    // Fallback to local update.
  }

  let updatedService: CompanyService | null = null
  localServicesState = localServicesState.map((service) => {
    if (service.id !== data.id) return service
    updatedService = { ...service, active: data.active }
    return updatedService
  })

  return updatedService
}
