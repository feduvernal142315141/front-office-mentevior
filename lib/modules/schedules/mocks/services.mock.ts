import type { ScheduleService } from "@/lib/types/appointment.types"

/**
 * Mock services data for scheduling module
 * These represent different ABA therapy service types
 * TODO: Replace with actual API calls when backend is ready
 */
export const MOCK_SERVICES: ScheduleService[] = [
  {
    id: "service-001",
    name: "ABA Therapy - Direct",
    code: "97153",
    durationMin: 120,
    color: "#037ECC", // Primary blue - brand color
    description: "Adaptive behavior treatment by protocol, administered by technician",
  },
  {
    id: "service-002",
    name: "ABA Therapy - Supervision",
    code: "97155",
    durationMin: 60,
    color: "#10B981", // Green - supervision
    description: "Adaptive behavior treatment with protocol modification",
  },
  {
    id: "service-003",
    name: "Parent Training",
    code: "97156",
    durationMin: 60,
    color: "#8B5CF6", // Purple - training
    description: "Family adaptive behavior treatment guidance",
  },
  {
    id: "service-004",
    name: "Initial Assessment",
    code: "97151",
    durationMin: 180,
    color: "#F59E0B", // Amber - assessment
    description: "Behavior identification assessment",
  },
  {
    id: "service-005",
    name: "Re-Assessment",
    code: "97152",
    durationMin: 120,
    color: "#EF4444", // Red - re-assessment
    description: "Behavior identification supporting assessment",
  },
  {
    id: "service-006",
    name: "Group Therapy",
    code: "97154",
    durationMin: 90,
    color: "#06B6D4", // Cyan - group
    description: "Group adaptive behavior treatment by protocol",
  },
]

/**
 * Get all mock services
 */
export function getMockServices(): ScheduleService[] {
  return MOCK_SERVICES
}

/**
 * Get a mock service by ID
 */
export function getMockServiceById(id: string): ScheduleService | undefined {
  return MOCK_SERVICES.find((service) => service.id === id)
}

/**
 * Get service color by ID (useful for calendar display)
 */
export function getServiceColor(serviceId: string): string {
  const service = getMockServiceById(serviceId)
  return service?.color ?? "#037ECC" // Default to brand color
}
