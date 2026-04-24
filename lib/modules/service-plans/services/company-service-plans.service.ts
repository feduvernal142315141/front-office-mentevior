import { serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  CompanyServicePlan,
  CreateCompanyServicePlanDto,
  UpdateCompanyServicePlanDto,
} from "@/lib/types/company-service-plan.types"

const DEFAULT_SERVICE_PLANS: CompanyServicePlan[] = [
  {
    id: "sp-aba-core",
    serviceId: "aba-therapy",
    serviceName: "ABA Therapy",
    name: "ABA Therapy",
    description: "Core service plan for ABA treatment goals.",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    active: true,
    categories: ["Behaviors", "Replacement/ Acquisition Programs", "Caregiver Training"],
  },
  {
    id: "sp-mental-health-basic",
    serviceId: "mental-health",
    serviceName: "Mental Health",
    name: "Mental Health",
    description: "Foundational plan for counseling and caregiver support.",
    startDate: "2026-03-01",
    endDate: "",
    active: false,
    categories: ["Caregivers Programs", "Play and Social Skills"],
  },
]

let localServicePlansState: CompanyServicePlan[] = DEFAULT_SERVICE_PLANS

function generateMockId(): string {
  return `sp-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

function asString(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => asString(entry)).filter((entry) => entry.length > 0)
}

function normalizeServicePlan(raw: unknown): CompanyServicePlan {
  const item = raw as Record<string, unknown>

  return {
    id: asString(item.id),
    serviceId: asString(item.serviceId ?? item.service_id),
    serviceName: asString(item.serviceName ?? item.service_name),
    name: asString(item.name),
    description: asString(item.description),
    startDate: asString(item.startDate ?? item.start_date),
    endDate: asString(item.endDate ?? item.end_date),
    active: Boolean(item.active),
    categories: normalizeStringArray(item.categories),
  }
}

export async function getCompanyServicePlans(): Promise<{
  servicePlans: CompanyServicePlan[]
  totalCount: number
}> {
  try {
    const response = await serviceGet<CompanyServicePlan[] | { entities?: CompanyServicePlan[] }>(
      "/service-company/plans"
    )

    if (response.status === 200 && response.data) {
      const rawPlans = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.entities)
          ? response.data.entities
          : []

      if (rawPlans.length > 0) {
        localServicePlansState = rawPlans.map((rawPlan) => normalizeServicePlan(rawPlan))
      }

      return {
        servicePlans: localServicePlansState,
        totalCount: localServicePlansState.length,
      }
    }
  } catch {
    // Fallback to mock state while backend endpoint is unavailable.
  }

  return {
    servicePlans: localServicePlansState,
    totalCount: localServicePlansState.length,
  }
}

export async function createCompanyServicePlan(
  payload: CreateCompanyServicePlanDto
): Promise<CompanyServicePlan> {
  try {
    const response = await servicePost<CreateCompanyServicePlanDto, CompanyServicePlan>(
      "/service-company/plans",
      payload
    )

    if ((response.status === 200 || response.status === 201) && response.data) {
      const createdPlan = normalizeServicePlan(response.data)
      localServicePlansState = [createdPlan, ...localServicePlansState]
      return createdPlan
    }
  } catch {
    // Fallback to local creation.
  }

  const createdPlan: CompanyServicePlan = {
    id: generateMockId(),
    serviceId: payload.serviceId,
    serviceName: payload.serviceName ?? "",
    name: payload.name,
    description: payload.description ?? "",
    startDate: payload.startDate,
    endDate: payload.endDate,
    active: payload.active,
    categories: payload.categories,
  }

  localServicePlansState = [createdPlan, ...localServicePlansState]
  return createdPlan
}

export async function updateCompanyServicePlan(
  planId: string,
  payload: UpdateCompanyServicePlanDto
): Promise<CompanyServicePlan | null> {
  try {
    const response = await servicePut<UpdateCompanyServicePlanDto, CompanyServicePlan>(
      `/service-company/plans/${planId}`,
      payload
    )

    if ((response.status === 200 || response.status === 201) && response.data) {
      const updatedPlan = normalizeServicePlan(response.data)
      localServicePlansState = localServicePlansState.map((plan) =>
        plan.id === planId ? updatedPlan : plan
      )
      return updatedPlan
    }
  } catch {
    // Fallback to local update.
  }

  let updatedPlan: CompanyServicePlan | null = null
  localServicePlansState = localServicePlansState.map((plan) => {
    if (plan.id !== planId) return plan

    updatedPlan = {
      ...plan,
      serviceId: payload.serviceId,
      serviceName: payload.serviceName ?? "",
      name: payload.name,
      description: payload.description ?? "",
      startDate: payload.startDate,
      endDate: payload.endDate,
      active: payload.active,
      categories: payload.categories,
    }

    return updatedPlan
  })

  return updatedPlan
}
