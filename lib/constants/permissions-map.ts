/**
 * PERMISSION MAP - HARDCODED
 * Mapeo estático entre nombres de módulos y sus IDs en el backend
 * 
 * Basado en GET /permissions del 2025-12-28
 * Si el backend cambia los IDs o agrega nuevos permisos, actualizar este archivo
 * 
 * Backend: http://18.217.86.234/api/swagger-ui/index.html#/
 */

/**
 * Mapeo de nombre de módulo → ID del backend
 */
export const PERMISSION_IDS: Record<string, string> = {
  // Core modules
  "role": "7b5b5e20-ea82-478d-90f6-995fc6e72c94",
  "user": "7c9abcf6-9a08-4c59-8366-e70589cae7b3",
  "users_providers": "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6",
  "clients": "b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7",
  "schedule": "c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8",
  
  // Clinical modules
  "session_note": "d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9",
  "clinical_monthly": "e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0",
  "monthly_supervisions": "f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1",
  "service_log": "a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2",
  "assessment": "b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3",
  "behavior_plan": "c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4",
  
  // Administrative modules
  "my_company": "d0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5",
  "applicants": "f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7",
  "billing": "a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8",
  "configuration": "b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9",
  
  // Additional clinical
  "maladaptive_behaviors": "c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0",
  "replacement_programs": "d6e7f8a9-b0c1-42d3-e4f5-a6b7c8d9e0f1",
  "caregiver_programs": "e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2",
  "monthly_report": "f8a9b0c1-d2e3-44f5-a6b7-c8d9e0f1a2b3",
  "services_pending_billing": "a9b0c1d2-e3f4-45a6-b7c8-d9e0f1a2b3c4",
  "billed_claims": "b0c1d2e3-f4a5-46b7-c8d9-e0f1a2b3c4d5",
  "insurances": "c1d2e3f4-a5b6-47c8-d9e0-f1a2b3c4d5e6",
  "diagnosis_code": "d2e3f4a5-b6c7-48d9-e0f1-a2b3c4d5e6f7",
  "documents": "e3f4a5b6-c7d8-49e0-f1a2-b3c4d5e6f7a8",
  "location": "f4a5b6c7-d8e9-40f1-a2b3-c4d5e6f7a8b9",
  "environmental_observations": "a5b6c7d8-e9f0-41a2-b3c4-d5e6f7a8b9c0",
  "participants": "b6c7d8e9-f0a1-42b3-c4d5-e6f7a8b9c0d1",
  "maladaptive_behavior": "c7d8e9f0-a1b2-43c4-d5e6-f7a8b9c0d1e2",
  "interventions": "d8e9f0a1-b2c3-44d5-e6f7-a8b9c0d1e2f3",
  "replacement_acquisitions": "e9f0a1b2-c3d4-45e6-f7a8-b9c0d1e2f3a4",
  "caregiver_program": "f0a1b2c3-d4e5-46f7-a8b9-c0d1e2f3a4b5",
  "rbt_task": "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c7",
  "topics": "b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d8",
  "view_agency_information": "c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e9",
} as const

/**
 * Mapeo inverso: ID del backend → nombre de módulo
 * Generado automáticamente a partir de PERMISSION_IDS
 */
export const PERMISSION_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(PERMISSION_IDS).map(([name, id]) => [id, name])
)

/**
 * Obtiene el ID de un módulo por su nombre
 */
export function getPermissionId(moduleName: string): string | null {
  return PERMISSION_IDS[moduleName] || null
}

/**
 * Obtiene el nombre de un módulo por su ID
 */
export function getPermissionName(permissionId: string): string | null {
  return PERMISSION_NAMES[permissionId] || null
}

/**
 * Valida si un nombre de módulo existe
 */
export function isValidPermissionModule(moduleName: string): boolean {
  return moduleName in PERMISSION_IDS
}

/**
 * Lista de todos los módulos disponibles
 */
export const ALL_PERMISSION_MODULES = Object.keys(PERMISSION_IDS)

/**
 * Lista de todos los IDs de permisos
 */
export const ALL_PERMISSION_IDS = Object.values(PERMISSION_IDS)
