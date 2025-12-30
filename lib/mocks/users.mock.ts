/**
 * MOCK DATA - MEMBER USERS
 * Datos de prueba para usuarios del Front Office
 * CompanyId ya no existe - el backend lo maneja por tenant
 */

import type { MemberUser } from "@/lib/types/user.types"
import { mockRoles } from "./roles.mock"

export const mockUsers: MemberUser[] = [
  {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@mentevior.com",
    cellphone: "+1 (555) 123-4567",
    hiringDate: "2024-01-15",
    roleId: "role-bcba",
    role: mockRoles.find(r => r.id === "role-bcba"),
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "user-2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@mentevior.com",
    cellphone: "+1 (555) 234-5678",
    hiringDate: "2024-02-01",
    roleId: "role-rbt",
    role: mockRoles.find(r => r.id === "role-rbt"),
    isActive: true,
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-01T09:00:00Z",
  },
  {
    id: "user-3",
    firstName: "Carlos",
    lastName: "Martinez",
    email: "carlos.martinez@mentevior.com",
    cellphone: "+1 (555) 345-6789",
    hiringDate: "2024-02-15",
    roleId: "role-bcaba",
    role: mockRoles.find(r => r.id === "role-bcaba"),
    isActive: true,
    createdAt: "2024-02-15T11:00:00Z",
    updatedAt: "2024-02-15T11:00:00Z",
  },
]

/**
 * Helper para buscar usuario por ID
 */
export function getMockUserById(id: string): MemberUser | undefined {
  return mockUsers.find(user => user.id === id)
}

/**
 * Helper para buscar usuarios activos (backend filtra por companyId automáticamente)
 */
export function getMockActiveUsers(): MemberUser[] {
  return mockUsers.filter(user => user.isActive)
}
