import type {
  PriorAuthorization,
  CreatePriorAuthorizationDto,
  UpdatePriorAuthorizationDto,
} from "@/lib/types/prior-authorization.types"
import {
  getPriorAuthorizationsByClientId as apiGetByClientId,
  createPriorAuthorization as apiCreate,
  updatePriorAuthorization as apiUpdate,
  deletePriorAuthorization as apiDelete,
} from "./prior-authorizations-api.service"

export async function getPriorAuthorizationsByClientId(
  clientId: string
): Promise<PriorAuthorization[]> {
  return apiGetByClientId(clientId)
}

export async function createPriorAuthorization(
  data: CreatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  return apiCreate(data)
}

export async function updatePriorAuthorization(
  data: UpdatePriorAuthorizationDto
): Promise<PriorAuthorization> {
  return apiUpdate(data)
}

export async function deletePriorAuthorization(paId: string): Promise<number> {
  return apiDelete(paId)
}
