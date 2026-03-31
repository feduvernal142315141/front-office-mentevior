import { serviceDelete, serviceGet, servicePost, servicePut } from "@/lib/services/baseService"
import type {
  ClientInsurance,
  CreateClientInsuranceDto,
  UpdateClientInsuranceDto,
} from "@/lib/types/client-insurance.types"

export async function getClientInsurancesByClientId(clientId: string): Promise<ClientInsurance[]> {
  const response = await serviceGet<ClientInsurance[]>(`/client/${clientId}/insurances`)

  if (response.status === 404) {
    return []
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch insurances")
  }

  return Array.isArray(response.data) ? response.data : []
}

export async function createClientInsurance(data: CreateClientInsuranceDto): Promise<ClientInsurance> {
  const response = await servicePost<CreateClientInsuranceDto, ClientInsurance>(
    `/client/${data.clientId}/insurances`,
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to create insurance")
  }

  return response.data as ClientInsurance
}

export async function updateClientInsurance(data: UpdateClientInsuranceDto): Promise<ClientInsurance> {
  const response = await servicePut<UpdateClientInsuranceDto, ClientInsurance>(
    `/client/insurances/${data.id}`,
    data
  )

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(response.data?.message || "Failed to update insurance")
  }

  return response.data as ClientInsurance
}

export async function deleteClientInsurance(insuranceId: string): Promise<void> {
  const response = await serviceDelete<void>(`/client/insurances/${insuranceId}`)

  if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
    throw new Error(response.data?.message || "Failed to delete insurance")
  }
}
