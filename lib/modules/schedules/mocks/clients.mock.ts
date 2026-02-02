import type { ScheduleClient } from "@/lib/types/appointment.types"

/**
 * Mock clients data for scheduling module
 * TODO: Replace with actual API calls when backend is ready
 */
export const MOCK_CLIENTS: ScheduleClient[] = [
  {
    id: "client-001",
    fullName: "Emma Rodriguez",
    code: "CL-2024-001",
    dateOfBirth: "2018-03-15",
    guardianName: "Maria Rodriguez",
    guardianPhone: "(305) 555-0101",
    address: "1234 Palm Ave, Miami, FL 33101",
    insuranceId: "INS-001",
    active: true,
  },
  {
    id: "client-002",
    fullName: "Liam Johnson",
    code: "CL-2024-002",
    dateOfBirth: "2019-07-22",
    guardianName: "Sarah Johnson",
    guardianPhone: "(305) 555-0102",
    address: "567 Ocean Dr, Miami Beach, FL 33139",
    insuranceId: "INS-002",
    active: true,
  },
  {
    id: "client-003",
    fullName: "Sophia Martinez",
    code: "CL-2024-003",
    dateOfBirth: "2017-11-08",
    guardianName: "Carlos Martinez",
    guardianPhone: "(305) 555-0103",
    address: "890 Coral Way, Coral Gables, FL 33134",
    insuranceId: "INS-003",
    active: true,
  },
  {
    id: "client-004",
    fullName: "Noah Williams",
    code: "CL-2024-004",
    dateOfBirth: "2020-02-14",
    guardianName: "Jennifer Williams",
    guardianPhone: "(305) 555-0104",
    address: "234 Brickell Ave, Miami, FL 33129",
    insuranceId: "INS-004",
    active: true,
  },
  {
    id: "client-005",
    fullName: "Olivia Brown",
    code: "CL-2024-005",
    dateOfBirth: "2018-09-30",
    guardianName: "Michael Brown",
    guardianPhone: "(305) 555-0105",
    address: "456 Key Biscayne Dr, Key Biscayne, FL 33149",
    insuranceId: "INS-005",
    active: true,
  },
  {
    id: "client-006",
    fullName: "William Davis",
    code: "CL-2024-006",
    dateOfBirth: "2019-04-18",
    guardianName: "Emily Davis",
    guardianPhone: "(305) 555-0106",
    address: "789 Coconut Grove Rd, Miami, FL 33133",
    insuranceId: "INS-006",
    active: true,
  },
  {
    id: "client-007",
    fullName: "Ava Garcia",
    code: "CL-2024-007",
    dateOfBirth: "2017-12-25",
    guardianName: "Roberto Garcia",
    guardianPhone: "(305) 555-0107",
    address: "321 Little Havana St, Miami, FL 33135",
    insuranceId: "INS-007",
    active: true,
  },
  {
    id: "client-008",
    fullName: "James Wilson",
    code: "CL-2024-008",
    dateOfBirth: "2020-06-10",
    guardianName: "Amanda Wilson",
    guardianPhone: "(305) 555-0108",
    address: "654 Wynwood Ave, Miami, FL 33127",
    insuranceId: "INS-008",
    active: false,
  },
]

/**
 * Get all mock clients
 */
export function getMockClients(): ScheduleClient[] {
  return MOCK_CLIENTS.filter((client) => client.active)
}

/**
 * Get a mock client by ID
 */
export function getMockClientById(id: string): ScheduleClient | undefined {
  return MOCK_CLIENTS.find((client) => client.id === id)
}

/**
 * Search mock clients by name
 */
export function searchMockClients(query: string): ScheduleClient[] {
  const lowercaseQuery = query.toLowerCase()
  return MOCK_CLIENTS.filter(
    (client) =>
      client.active &&
      (client.fullName.toLowerCase().includes(lowercaseQuery) ||
        client.code.toLowerCase().includes(lowercaseQuery))
  )
}
