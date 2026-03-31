// ─── Prior Authorizations — REST API Service ──────────────────────────────────
// TODO (backend integration): Implement these functions when the API is ready.
// All endpoints are stubs — they throw "Not implemented" until wired.
//
// Expected endpoints (confirm with backend team):
//  GET    /client/:clientId/prior-authorizations
//  POST   /client/:clientId/prior-authorizations
//  PUT    /client/prior-authorizations/:id
//  PATCH  /client/prior-authorizations/:id/cancel   (soft-cancel, not DELETE)
//  POST   /client/prior-authorizations/:id/files    (file upload)
//  GET    /client/prior-authorizations/:paId/billing-codes/:codeId/events
//
// Auth: Bearer token via serviceGet/servicePost/servicePut/serviceDelete
// Tenant: extracted from JWT — no clientId leakage between tenants
// ─────────────────────────────────────────────────────────────────────────────

import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  PriorAuthorization,
  CreatePriorAuthorizationDto,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"

export async function getPriorAuthorizationsByClientId(
  clientId: string
): Promise<PriorAuthorization[]> {
  const response = await serviceGet<PriorAuthorization[]>(
    `/client/${clientId}/prior-authorizations`
  )

  if (response.status === 404) return []

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch prior authorizations")
  }

  return Array.isArray(response.data) ? response.data : []
}

export async function createPriorAuthorization(
  data: CreatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  const response = await servicePost<CreatePriorAuthorizationDto, PriorAuthorization>(
    `/client/${data.clientId}/prior-authorizations`,
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create prior authorization")
  }

  return response.data as PriorAuthorization
}

export async function updatePriorAuthorization(
  data: UpdatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  const response = await servicePut<UpdatePriorAuthorizationDto, PriorAuthorization>(
    `/client/prior-authorizations/${data.id}`,
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update prior authorization")
  }

  return response.data as PriorAuthorization
}

export async function cancelPriorAuthorization(paId: string): Promise<void> {
  const response = await serviceDelete<void>(
    `/client/prior-authorizations/${paId}/cancel`
  )

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to cancel prior authorization")
  }
}
