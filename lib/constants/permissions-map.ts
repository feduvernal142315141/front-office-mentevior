/**
 * PERMISSION MAP - HARDCODED
 * Mapeo estático entre nombres de módulos y sus IDs en el backend
 * 
 * Actualizado: 2026-01-06 (37 entidades)
 * Si el backend cambia los IDs o agrega nuevos permisos, actualizar este archivo
 * 
 * Backend: http://18.217.86.234/api/swagger-ui/index.html#/
 */

/**
 * Mapeo de nombre de módulo → ID del backend
 */
export const PERMISSION_IDS: Record<string, string> = {
  // Core modules
  "users_providers": "a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6",
  "clients": "b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7",
  "schedule": "c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8",
  "session_note": "d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9",
  "clinical_monthly": "e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0",
  "monthly_supervisions": "f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1",
  "service_log": "a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2",
  "assessment": "b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3",
  
  // Behavior Plan (parent with real permission + children)
  "behavior_plan": "c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4",
  "maladaptive_behaviors": "c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0",
  "replacement_programs": "d6e7f8a9-b0c1-42d3-e4f5-a6b7c8d9e0f1",
  "caregiver_programs": "e7f8a9b0-c1d2-43e4-f5a6-b7c8d9e0f1a2",
  
  // My Company modules
  "role": "7b5b5e20-ea82-478d-90f6-995fc6e72c94",
  "account_profile": "a1a2a3a4-b5b6-47c8-d9e0-f1a2b3c4d5e6",
  "services_pending_billing": "a9b0c1d2-e3f4-45a6-b7c8-d9e0f1a2b3c4",
  "billed_claims": "b0c1d2e3-f4a5-46b7-c8d9-e0f1a2b3c4d5",
  "appointment": "c4d5e6f7-a8b9-41c0-d1e2-f3a4b5c6d7e8",
  "service_plan": "d5e6f7a8-b9c0-42d1-e2f3-a4b5c6d7e8f9",
  "supervision": "e6f7a8b9-c0d1-43e2-f3a4-b5c6d7e8f9a0",
  "physicians": "a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8",
  "service_plans": "b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9",
  "monthly_report": "f8a9b0c1-d2e3-44f5-a6b7-c8d9e0f1a2b3",
  "clinical_documents": "29197f79-6e31-4083-be25-a4710a4f8ffe",
  "hr_documents": "074669dd-8744-4a64-a19b-f64dc18acc85",
  "agreements": "0d2c3e7c-b414-4c70-a5fb-f250caf08b8f",
  "applicants": "f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7",
  
  // Data Collection children (real permissions)
  "datasheets": "a0b1c2d3-e4f5-46a7-b8c9-d0e1f2a3b4c5",
  "on_site_collection": "b1c2d3e4-f5a6-47b8-c9d0-e1f2a3b4c5d6",
  "charts": "c2d3e4f5-a6b7-48c9-d0e1-f2a3b4c5d6e7",
  "data_analysis": "d3e4f5a6-b7c8-49d0-e1f2-a3b4c5d6e7f8",
  "raw_data": "e4f5a6b7-c8d9-40e1-f2a3-b4c5d6e7f8a9",
  
  // Signatures Caregiver children (real permissions)
  "check": "f5a6b7c8-d9e0-41f2-a3b4-c5d6e7f8a9b0",
  "sign": "a6b7c8d9-e0f1-42a3-b4c5-d6e7f8a9b0c1",
  
  // Template Documents children (real permissions)
  "session_note_configuration": "b7c8d9e0-f1a2-43b4-c5d6-e7f8a9b0c1d2",
  "clinical_monthly_configuration": "c8d9e0f1-a2b3-44c5-d6e7-f8a9b0c1d2e3",
  "service_log_configuration": "d9e0f1a2-b3c4-45d6-e7f8-a9b0c1d2e3f4",
  "monthly_supervisions_configuration": "e0f1a2b3-c4d5-46e7-f8a9-b0c1d2e3f4a5",
  "assessment_configuration": "f1a2b3c4-d5e6-47f8-a9b0-c1d2e3f4a5b6",
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
