// ─── Prior Authorizations — Service Layer ─────────────────────────────────────
// Toggle USE_MOCK = false to switch to the real API.
// The mock and API services have identical signatures — zero changes needed
// in hooks or components when flipping this flag.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  PriorAuthorization,
  CreatePriorAuthorizationDto,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"
import {
  getMockPAsByClientId,
  createMockPA,
  updateMockPA,
  cancelMockPA,
} from "../mocks/prior-authorizations.mock"

// TODO (backend integration): Set to false when API is ready
const USE_MOCK = true

export async function getPriorAuthorizationsByClientId(
  clientId: string
): Promise<PriorAuthorization[]> {
  if (USE_MOCK) return getMockPAsByClientId(clientId)

  const { getPriorAuthorizationsByClientId: apiGet } = await import(
    "./prior-authorizations-api.service"
  )
  return apiGet(clientId)
}

export async function createPriorAuthorization(
  data: CreatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  if (USE_MOCK) return createMockPA(data)

  const { createPriorAuthorization: apiCreate } = await import(
    "./prior-authorizations-api.service"
  )
  return apiCreate(data)
}

export async function updatePriorAuthorization(
  data: UpdatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  if (USE_MOCK) return updateMockPA(data)

  const { updatePriorAuthorization: apiUpdate } = await import(
    "./prior-authorizations-api.service"
  )
  return apiUpdate(data)
}

export async function cancelPriorAuthorization(paId: string): Promise<void> {
  if (USE_MOCK) return cancelMockPA(paId)

  const { cancelPriorAuthorization: apiCancel } = await import(
    "./prior-authorizations-api.service"
  )
  return apiCancel(paId)
}
