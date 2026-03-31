import type {
  ClientInsurance,
  CreateClientInsuranceDto,
  UpdateClientInsuranceDto,
} from "@/lib/types/client-insurance.types"
import {
  createMockInsurance,
  deleteMockInsurance,
  getMockInsurancesByClientId,
  updateMockInsurance,
} from "../mocks/client-insurances.mock"

const USE_MOCK = true

export async function getClientInsurancesByClientId(clientId: string): Promise<ClientInsurance[]> {
  if (USE_MOCK) {
    return getMockInsurancesByClientId(clientId)
  }

  const { getClientInsurancesByClientId: apiGet } = await import("./client-insurances-api.service")
  return apiGet(clientId)
}

export async function createClientInsurance(data: CreateClientInsuranceDto): Promise<ClientInsurance> {
  if (USE_MOCK) {
    return createMockInsurance(data)
  }

  const { createClientInsurance: apiCreate } = await import("./client-insurances-api.service")
  return apiCreate(data)
}

export async function updateClientInsurance(data: UpdateClientInsuranceDto): Promise<ClientInsurance> {
  if (USE_MOCK) {
    return updateMockInsurance(data)
  }

  const { updateClientInsurance: apiUpdate } = await import("./client-insurances-api.service")
  return apiUpdate(data)
}

export async function deleteClientInsurance(insuranceId: string): Promise<void> {
  if (USE_MOCK) {
    return deleteMockInsurance(insuranceId)
  }

  const { deleteClientInsurance: apiDelete } = await import("./client-insurances-api.service")
  return apiDelete(insuranceId)
}
