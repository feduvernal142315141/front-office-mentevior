import type { ScheduleUser } from "@/lib/types/appointment.types"

/**
 * Mock users data for scheduling module
 * Includes RBTs, BCBAs, and Admins
 * TODO: Replace with actual API calls when backend is ready
 */
export const MOCK_SCHEDULE_USERS: ScheduleUser[] = [
  // RBTs (Registered Behavior Technicians)
  {
    id: "rbt-001",
    fullName: "Ana Fernandez",
    email: "ana.fernandez@mentevior.com",
    role: "RBT",
    avatar: undefined,
    active: true,
  },
  {
    id: "rbt-002",
    fullName: "David Chen",
    email: "david.chen@mentevior.com",
    role: "RBT",
    avatar: undefined,
    active: true,
  },
  {
    id: "rbt-003",
    fullName: "Jessica Thompson",
    email: "jessica.thompson@mentevior.com",
    role: "RBT",
    avatar: undefined,
    active: true,
  },
  {
    id: "rbt-004",
    fullName: "Marcus Rivera",
    email: "marcus.rivera@mentevior.com",
    role: "RBT",
    avatar: undefined,
    active: true,
  },
  
  // BCBAs (Board Certified Behavior Analysts)
  {
    id: "bcba-001",
    fullName: "Dr. Sarah Mitchell",
    email: "sarah.mitchell@mentevior.com",
    role: "BCBA",
    avatar: undefined,
    active: true,
  },
  {
    id: "bcba-002",
    fullName: "Dr. Robert Kim",
    email: "robert.kim@mentevior.com",
    role: "BCBA",
    avatar: undefined,
    active: true,
  },
  {
    id: "bcba-003",
    fullName: "Dr. Laura Gonzalez",
    email: "laura.gonzalez@mentevior.com",
    role: "BCBA",
    avatar: undefined,
    active: true,
  },
  
  // Admins
  {
    id: "admin-001",
    fullName: "Admin User",
    email: "admin@mentevior.com",
    role: "Admin",
    avatar: undefined,
    active: true,
  },
]

/**
 * Get all mock users
 */
export function getMockScheduleUsers(): ScheduleUser[] {
  return MOCK_SCHEDULE_USERS.filter((user) => user.active)
}

/**
 * Get a mock user by ID
 */
export function getMockUserById(id: string): ScheduleUser | undefined {
  return MOCK_SCHEDULE_USERS.find((user) => user.id === id)
}

/**
 * Get users by role
 */
export function getMockUsersByRole(role: ScheduleUser["role"]): ScheduleUser[] {
  return MOCK_SCHEDULE_USERS.filter((user) => user.role === role && user.active)
}

/**
 * Get all RBTs
 */
export function getMockRBTs(): ScheduleUser[] {
  return getMockUsersByRole("RBT")
}

/**
 * Get all BCBAs
 */
export function getMockBCBAs(): ScheduleUser[] {
  return getMockUsersByRole("BCBA")
}
