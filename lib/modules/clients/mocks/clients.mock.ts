import type { Client, ClientListItem } from "@/lib/types/client.types"

export const MOCK_CLIENTS: Client[] = [
  {
    id: "client-001",
    firstName: "Emma",
    lastName: "Rodriguez",
    phoneNumber: "(305) 555-0100",
    chartId: "CH-2024-001",
    diagnosisCode: "F84.0",
    insuranceId: "ins-001",
    insurance: { id: "ins-001", name: "Blue Cross Blue Shield" },
    rbtId: "rbt-001",
    rbt: { id: "rbt-001", firstName: "Sarah", lastName: "Johnson", fullName: "Sarah Johnson" },
    dateOfBirth: "2018-03-15",
    guardianName: "Maria Rodriguez",
    guardianPhone: "(305) 555-0101",
    address: "1234 Palm Ave, Miami, FL 33101",
    active: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "client-002",
    firstName: "Liam",
    lastName: "Chen",
    phoneNumber: "(305) 555-0200",
    chartId: "CH-2024-002",
    diagnosisCode: "F84.5",
    insuranceId: "ins-002",
    insurance: { id: "ins-002", name: "Aetna" },
    rbtId: "rbt-002",
    rbt: { id: "rbt-002", firstName: "Michael", lastName: "Brown", fullName: "Michael Brown" },
    dateOfBirth: "2019-07-22",
    guardianName: "Lisa Chen",
    guardianPhone: "(305) 555-0102",
    address: "5678 Ocean Dr, Miami Beach, FL 33139",
    active: true,
    createdAt: "2024-01-16T14:30:00Z",
    updatedAt: "2024-01-16T14:30:00Z",
  },
  {
    id: "client-003",
    firstName: "Sophia",
    lastName: "Martinez",
    phoneNumber: "(305) 555-0300",
    chartId: "CH-2024-003",
    diagnosisCode: "F84.0",
    insuranceId: "ins-001",
    insurance: { id: "ins-001", name: "Blue Cross Blue Shield" },
    rbtId: "rbt-001",
    rbt: { id: "rbt-001", firstName: "Sarah", lastName: "Johnson", fullName: "Sarah Johnson" },
    dateOfBirth: "2017-11-08",
    guardianName: "Carlos Martinez",
    guardianPhone: "(305) 555-0103",
    address: "9012 Sunset Blvd, Coral Gables, FL 33134",
    active: true,
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-02-01T11:20:00Z",
  },
  {
    id: "client-004",
    firstName: "Noah",
    lastName: "Thompson",
    phoneNumber: "(305) 555-0400",
    chartId: "CH-2024-004",
    diagnosisCode: "F84.8",
    insuranceId: "ins-003",
    insurance: { id: "ins-003", name: "UnitedHealthcare" },
    rbtId: "rbt-003",
    rbt: { id: "rbt-003", firstName: "Jessica", lastName: "Davis", fullName: "Jessica Davis" },
    dateOfBirth: "2018-05-30",
    guardianName: "Amanda Thompson",
    guardianPhone: "(305) 555-0104",
    address: "3456 Bay Rd, Key Biscayne, FL 33149",
    active: false,
    createdAt: "2024-01-25T16:45:00Z",
    updatedAt: "2024-02-10T13:30:00Z",
  },
  {
    id: "client-005",
    firstName: "Olivia",
    lastName: "Garcia",
    phoneNumber: "(305) 555-0500",
    chartId: "CH-2024-005",
    diagnosisCode: "F84.0",
    insuranceId: "ins-002",
    insurance: { id: "ins-002", name: "Aetna" },
    rbtId: "rbt-002",
    rbt: { id: "rbt-002", firstName: "Michael", lastName: "Brown", fullName: "Michael Brown" },
    dateOfBirth: "2019-01-12",
    guardianName: "Roberto Garcia",
    guardianPhone: "(305) 555-0105",
    address: "7890 Collins Ave, Miami Beach, FL 33140",
    active: true,
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-02-01T10:00:00Z",
  },
  {
    id: "client-006",
    firstName: "Ethan",
    lastName: "Williams",
    phoneNumber: "(305) 555-0600",
    chartId: "CH-2024-006",
    diagnosisCode: "F84.5",
    insuranceId: "ins-004",
    insurance: { id: "ins-004", name: "Cigna" },
    rbtId: "rbt-001",
    rbt: { id: "rbt-001", firstName: "Sarah", lastName: "Johnson", fullName: "Sarah Johnson" },
    dateOfBirth: "2018-09-18",
    guardianName: "Jennifer Williams",
    guardianPhone: "(305) 555-0106",
    address: "2345 Brickell Ave, Miami, FL 33129",
    active: true,
    createdAt: "2024-02-05T11:30:00Z",
    updatedAt: "2024-02-05T11:30:00Z",
  },
  {
    id: "client-007",
    firstName: "Ava",
    lastName: "Brown",
    phoneNumber: "(305) 555-0700",
    chartId: "CH-2024-007",
    diagnosisCode: "F84.0",
    insuranceId: "ins-001",
    insurance: { id: "ins-001", name: "Blue Cross Blue Shield" },
    rbtId: "rbt-003",
    rbt: { id: "rbt-003", firstName: "Jessica", lastName: "Davis", fullName: "Jessica Davis" },
    dateOfBirth: "2017-12-25",
    guardianName: "Patricia Brown",
    guardianPhone: "(305) 555-0107",
    address: "4567 Miracle Mile, Coral Gables, FL 33146",
    active: true,
    createdAt: "2024-02-08T15:20:00Z",
    updatedAt: "2024-02-08T15:20:00Z",
  },
  {
    id: "client-008",
    firstName: "Mason",
    lastName: "Davis",
    phoneNumber: "(305) 555-0800",
    chartId: "CH-2024-008",
    diagnosisCode: "F84.8",
    insuranceId: "ins-003",
    insurance: { id: "ins-003", name: "UnitedHealthcare" },
    rbtId: "rbt-002",
    rbt: { id: "rbt-002", firstName: "Michael", lastName: "Brown", fullName: "Michael Brown" },
    dateOfBirth: "2019-04-10",
    guardianName: "David Davis",
    guardianPhone: "(305) 555-0108",
    address: "6789 SW 8th St, Miami, FL 33135",
    active: false,
    createdAt: "2024-02-12T09:00:00Z",
    updatedAt: "2024-02-15T14:45:00Z",
  },
  {
    id: "client-009",
    firstName: "Isabella",
    lastName: "Miller",
    phoneNumber: "(305) 555-0900",
    chartId: "CH-2024-009",
    diagnosisCode: "F84.0",
    insuranceId: "ins-002",
    insurance: { id: "ins-002", name: "Aetna" },
    rbtId: "rbt-001",
    rbt: { id: "rbt-001", firstName: "Sarah", lastName: "Johnson", fullName: "Sarah Johnson" },
    dateOfBirth: "2018-06-14",
    guardianName: "Susan Miller",
    guardianPhone: "(305) 555-0109",
    address: "8901 NE 2nd Ave, Miami, FL 33138",
    active: true,
    createdAt: "2024-02-18T13:15:00Z",
    updatedAt: "2024-02-18T13:15:00Z",
  },
  {
    id: "client-010",
    firstName: "Lucas",
    lastName: "Wilson",
    phoneNumber: "(305) 555-1000",
    chartId: "CH-2024-010",
    diagnosisCode: "F84.5",
    insuranceId: "ins-004",
    insurance: { id: "ins-004", name: "Cigna" },
    rbtId: "rbt-003",
    rbt: { id: "rbt-003", firstName: "Jessica", lastName: "Davis", fullName: "Jessica Davis" },
    dateOfBirth: "2017-10-05",
    guardianName: "Thomas Wilson",
    guardianPhone: "(305) 555-0110",
    address: "1234 Lincoln Rd, Miami Beach, FL 33139",
    active: true,
    createdAt: "2024-02-20T10:30:00Z",
    updatedAt: "2024-02-20T10:30:00Z",
  },
  {
    id: "client-011",
    firstName: "Mia",
    lastName: "Moore",
    phoneNumber: "(305) 555-1100",
    chartId: "CH-2024-011",
    diagnosisCode: "F84.0",
    insuranceId: "ins-001",
    insurance: { id: "ins-001", name: "Blue Cross Blue Shield" },
    rbtId: "rbt-002",
    rbt: { id: "rbt-002", firstName: "Michael", lastName: "Brown", fullName: "Michael Brown" },
    dateOfBirth: "2019-02-28",
    guardianName: "Nancy Moore",
    guardianPhone: "(305) 555-0111",
    address: "5678 Flagler St, Miami, FL 33134",
    active: true,
    createdAt: "2024-02-22T14:00:00Z",
    updatedAt: "2024-02-22T14:00:00Z",
  },
  {
    id: "client-012",
    firstName: "James",
    lastName: "Taylor",
    phoneNumber: "(305) 555-1200",
    chartId: "CH-2024-012",
    diagnosisCode: "F84.8",
    insuranceId: "ins-003",
    insurance: { id: "ins-003", name: "UnitedHealthcare" },
    rbtId: "rbt-001",
    rbt: { id: "rbt-001", firstName: "Sarah", lastName: "Johnson", fullName: "Sarah Johnson" },
    dateOfBirth: "2018-08-20",
    guardianName: "Robert Taylor",
    guardianPhone: "(305) 555-0112",
    address: "9012 Alton Rd, Miami Beach, FL 33141",
    active: false,
    createdAt: "2024-02-25T11:45:00Z",
    updatedAt: "2024-03-01T09:20:00Z",
  },
]

export function getMockClients(): Client[] {
  return MOCK_CLIENTS
}

export function getMockClientById(id: string): Client | undefined {
  return MOCK_CLIENTS.find((client) => client.id === id)
}

export function searchMockClients(query: string): Client[] {
  const lowerQuery = query.toLowerCase()
  return MOCK_CLIENTS.filter(
    (client) =>
      client.firstName.toLowerCase().includes(lowerQuery) ||
      client.lastName.toLowerCase().includes(lowerQuery) ||
      (client.chartId && client.chartId.toLowerCase().includes(lowerQuery)) ||
      (client.diagnosisCode && client.diagnosisCode.toLowerCase().includes(lowerQuery))
  )
}

export function getMockClientListItems(): ClientListItem[] {
  return MOCK_CLIENTS.map((client) => ({
    id: client.id,
    fullName: `${client.firstName} ${client.lastName}`,
    chartId: client.chartId || "",
    diagnosisCode: client.diagnosisCode || "",
    insuranceName: client.insurance?.name || "",
    rbtName: client.rbt?.fullName || "",
    active: client.active,
  }))
}

export function filterMockClients(params: {
  search?: string
  active?: boolean
  insurance?: string
  rbt?: string
}): ClientListItem[] {
  let filtered = MOCK_CLIENTS

  if (params.search) {
    const lowerQuery = params.search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.firstName.toLowerCase().includes(lowerQuery) ||
        c.lastName.toLowerCase().includes(lowerQuery) ||
        (c.chartId && c.chartId.toLowerCase().includes(lowerQuery))
    )
  }

  if (params.active !== undefined) {
    filtered = filtered.filter((c) => c.active === params.active)
  }

  if (params.insurance && params.insurance !== "all") {
    filtered = filtered.filter((c) => c.insurance?.name === params.insurance)
  }

  if (params.rbt && params.rbt !== "all") {
    filtered = filtered.filter((c) => c.rbt?.fullName === params.rbt)
  }

  return filtered.map((client) => ({
    id: client.id,
    fullName: `${client.firstName} ${client.lastName}`,
    chartId: client.chartId || "",
    diagnosisCode: client.diagnosisCode || "",
    insuranceName: client.insurance?.name || "",
    rbtName: client.rbt?.fullName || "",
    active: client.active,
  }))
}

export function paginateMockClients(
  items: ClientListItem[],
  page: number,
  pageSize: number
): { clients: ClientListItem[]; totalCount: number } {
  const start = page * pageSize
  const end = start + pageSize
  return {
    clients: items.slice(start, end),
    totalCount: items.length,
  }
}
