import type {
  ClientInsurance,
  CreateClientInsuranceDto,
  UpdateClientInsuranceDto,
} from "@/lib/types/client-insurance.types"

const DEFAULT_CLIENT_ID = "mock-client-1"

const MOCK_INSURANCES_SEED: ClientInsurance[] = [
  {
    id: "ins-1",
    clientId: DEFAULT_CLIENT_ID,
    payerId: "payer-1",
    payerName: "Carelon Behavioral Health",
    payerLogoUrl: null,
    memberNumber: "9556927841",
    groupNumber: "",
    relationship: "Self",
    isActive: false,
    isPrimary: false,
    effectiveDate: "2025-01-01",
    terminationDate: "2025-05-31",
    comments: "",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "ins-2",
    clientId: DEFAULT_CLIENT_ID,
    payerId: "payer-2",
    payerName: "Children's Medical Services Health Plan",
    payerLogoUrl: null,
    memberNumber: "9556927841",
    groupNumber: "GRP-001",
    relationship: "Self",
    isActive: true,
    isPrimary: true,
    effectiveDate: "2025-06-01",
    terminationDate: "",
    comments: "",
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
]

let mockInsurancesDb: ClientInsurance[] = [...MOCK_INSURANCES_SEED]

function makeInsuranceId(): string {
  return `ins-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getMockInsurancesByClientId(clientId: string): ClientInsurance[] {
  const byClient = mockInsurancesDb.filter((ins) => ins.clientId === clientId)
  if (byClient.length > 0) {
    return byClient
  }

  return []
}

export function createMockInsurance(data: CreateClientInsuranceDto): ClientInsurance {
  const id = makeInsuranceId()
  const now = new Date().toISOString()

  if (data.isPrimary) {
    mockInsurancesDb = mockInsurancesDb.map((ins) =>
      ins.clientId === data.clientId ? { ...ins, isPrimary: false } : ins
    )
  }

  const created: ClientInsurance = {
    id,
    clientId: data.clientId,
    payerId: data.payerId,
    payerName: "",
    payerLogoUrl: null,
    memberNumber: data.memberNumber,
    groupNumber: data.groupNumber ?? "",
    relationship: data.relationship,
    isActive: data.isActive,
    isPrimary: data.isPrimary,
    effectiveDate: data.effectiveDate,
    terminationDate: data.terminationDate ?? "",
    comments: data.comments ?? "",
    createdAt: now,
    updatedAt: now,
  }

  mockInsurancesDb = [created, ...mockInsurancesDb]
  return created
}

export function updateMockInsurance(data: UpdateClientInsuranceDto): ClientInsurance {
  const existing = mockInsurancesDb.find((ins) => ins.id === data.id)

  if (!existing) {
    throw new Error("Insurance not found")
  }

  if (data.isPrimary) {
    mockInsurancesDb = mockInsurancesDb.map((ins) =>
      ins.clientId === existing.clientId && ins.id !== data.id
        ? { ...ins, isPrimary: false }
        : ins
    )
  }

  const updated: ClientInsurance = {
    ...existing,
    payerId: data.payerId,
    memberNumber: data.memberNumber,
    groupNumber: data.groupNumber ?? "",
    relationship: data.relationship,
    isActive: data.isActive,
    isPrimary: data.isPrimary,
    effectiveDate: data.effectiveDate,
    terminationDate: data.terminationDate ?? "",
    comments: data.comments ?? "",
    updatedAt: new Date().toISOString(),
  }

  mockInsurancesDb = mockInsurancesDb.map((ins) => (ins.id === data.id ? updated : ins))
  return updated
}

export function deleteMockInsurance(insuranceId: string): void {
  const existing = mockInsurancesDb.find((ins) => ins.id === insuranceId)

  if (!existing) {
    throw new Error("Insurance not found")
  }

  mockInsurancesDb = mockInsurancesDb.filter((ins) => ins.id !== insuranceId)
}
