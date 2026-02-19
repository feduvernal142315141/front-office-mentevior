export interface Insurance {
  id: string
  name: string
}

export const MOCK_INSURANCES: Insurance[] = [
  { id: "ins-001", name: "Blue Cross Blue Shield" },
  { id: "ins-002", name: "Aetna" },
  { id: "ins-003", name: "UnitedHealthcare" },
  { id: "ins-004", name: "Cigna" },
  { id: "ins-005", name: "Humana" },
  { id: "ins-006", name: "Kaiser Permanente" },
]

export function getMockInsurances(): Insurance[] {
  return MOCK_INSURANCES
}
