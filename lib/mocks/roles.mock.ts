/**
 * ROLES MOCK DATA
 * Este archivo solo se usa para el mock de usuarios
 * El módulo de roles YA ESTÁ usando el backend real
 */

import type { Role } from "@/lib/types/role.types"

export const mockRoles: Role[] = [
  {
    id: "role-1",
    name: "Company Admin",
    permissions: ["role-15", "users_providers-15", "clients-15"],
    isActive: true,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "role-2",
    name: "BCBA",
    permissions: ["clients-7", "session_note-7"],
    isActive: true,
    createdAt: "2024-01-20T14:20:00Z",
  },
  {
    id: "role-3",
    name: "RBT",
    permissions: ["session_note-1"],
    isActive: true,
    createdAt: "2024-02-01T09:15:00Z",
  },
]

/**
 * Obtener roles activos
 */
export function getMockActiveRoles(): Role[] {
  return mockRoles.filter(r => r.isActive)
}
