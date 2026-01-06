export enum PermissionAction {
  NONE = 0,
  CREATE = 1,
  EDIT = 2,
  DELETE = 4,
  BLOCK = 8,
  ALL = 15,
}

export enum PermissionModule {
  USERS_PROVIDERS = "users_providers",
  CLIENTS = "clients",
  SCHEDULE = "schedule",
  SESSION_NOTE = "session_note",
  CLINICAL_MONTHLY = "clinical_monthly",
  MONTHLY_SUPERVISIONS = "monthly_supervisions",
  SERVICE_LOG = "service_log",
  ASSESSMENT = "assessment",

  BEHAVIOR_PLAN = "behavior_plan",
  MALADAPTIVE_BEHAVIORS = "maladaptive_behaviors",
  REPLACEMENT_PROGRAMS = "replacement_programs",
  CAREGIVER_PROGRAMS = "caregiver_programs",
  
  ROLE = "role",
  MY_COMPANY = "account_profile",
  BILLING = "services_pending_billing",
  ACCOUNT_PROFILE = "account_profile",
  SERVICES_PENDING_BILLING = "services_pending_billing",
  BILLED_CLAIMS = "billed_claims",
  APPOINTMENT = "appointment",
  SERVICE_PLAN = "service_plan",
  SUPERVISION = "supervision",
  PHYSICIANS = "physicians",
  SERVICE_PLANS = "service_plans",
  MONTHLY_REPORT = "monthly_report",
  CLINICAL_DOCUMENTS = "clinical_documents",
  HR_DOCUMENTS = "hr_documents",
  AGREEMENTS = "agreements",
  APPLICANTS = "applicants",
  
  DATASHEETS = "datasheets",
  ON_SITE_COLLECTION = "on_site_collection",
  CHARTS = "charts",
  DATA_ANALYSIS = "data_analysis",
  RAW_DATA = "raw_data",
  
  CHECK = "check",
  SIGN = "sign",
  
  SESSION_NOTE_CONFIGURATION = "session_note_configuration",
  CLINICAL_MONTHLY_CONFIGURATION = "clinical_monthly_configuration",
  SERVICE_LOG_CONFIGURATION = "service_log_configuration",
  MONTHLY_SUPERVISIONS_CONFIGURATION = "monthly_supervisions_configuration",
  ASSESSMENT_CONFIGURATION = "assessment_configuration",
}

export function parsePermission(permission: string): { module: string; value: number } | null {
  const parts = permission.split("-")
  if (parts.length !== 2) return null
  
  const module = parts[0]
  const value = parseInt(parts[1], 10)
  
  if (isNaN(value)) return null
  
  return { module, value }
}

export function hasModulePermission(
  permissions: string[],
  module: PermissionModule | string,
  action: PermissionAction
): boolean {
  const permission = permissions.find(p => p.startsWith(`${module}-`))
  if (!permission) return false
  
  const parsed = parsePermission(permission)
  if (!parsed) return false
  
  return (parsed.value & action) === action
}

export function canCreate(permissions: string[], module: PermissionModule | string): boolean {
  return hasModulePermission(permissions, module, PermissionAction.CREATE)
}

export function canEdit(permissions: string[], module: PermissionModule | string): boolean {
  return hasModulePermission(permissions, module, PermissionAction.EDIT)
}

export function canDelete(permissions: string[], module: PermissionModule | string): boolean {
  return hasModulePermission(permissions, module, PermissionAction.DELETE)
}

export function canBlock(permissions: string[], module: PermissionModule | string): boolean {
  return hasModulePermission(permissions, module, PermissionAction.BLOCK)
}

export function canView(permissions: string[], module: PermissionModule | string): boolean {
  const value = getModulePermissionValue(permissions, module)
  return value > 0
}

export function getModulePermissionValue(permissions: string[], module: PermissionModule | string): number {
  const permission = permissions.find(p => p.startsWith(`${module}-`))
  if (!permission) return 0
  
  const parsed = parsePermission(permission)
  return parsed?.value ?? 0
}

export function createPermissionString(module: PermissionModule | string, value: number): string {
  return `${module}-${value}`
}

export function setModulePermission(
  permissions: string[],
  module: PermissionModule | string,
  value: number
): string[] {
  const filtered = permissions.filter(p => !p.startsWith(`${module}-`))
  
  if (value > 0) {
    filtered.push(createPermissionString(module, value))
  }
  
  return filtered
}

export function getModuleActions(permissions: string[], module: PermissionModule | string): PermissionAction[] {
  const value = getModulePermissionValue(permissions, module)
  const actions: PermissionAction[] = []
  
  if (value & PermissionAction.CREATE) actions.push(PermissionAction.CREATE)
  if (value & PermissionAction.EDIT) actions.push(PermissionAction.EDIT)
  if (value & PermissionAction.DELETE) actions.push(PermissionAction.DELETE)
  if (value & PermissionAction.BLOCK) actions.push(PermissionAction.BLOCK)
  
  return actions
}

export function permissionsToObject(permissions: string[]): Record<string, number> {
  const obj: Record<string, number> = {}
  
  permissions.forEach(permission => {
    const parsed = parsePermission(permission)
    if (parsed) {
      obj[parsed.module] = parsed.value
    }
  })
  
  return obj
}

export function objectToPermissions(obj: Record<string, number>): string[] {
  return Object.entries(obj)
    .filter(([_, value]) => value > 0)
    .map(([module, value]) => createPermissionString(module, value))
}

export function debugPermissions(permissions: string[], module: PermissionModule | string): void {
  console.group(`🔍 Debug Permissions for module: ${module}`)
  
  const permission = permissions.find(p => p.startsWith(`${module}-`))
  console.log("📋 All permissions:", permissions)
  console.log(`🎯 Looking for module: "${module}"`)
  console.log(`✅ Found permission:`, permission || "❌ NOT FOUND")
  
  if (permission) {
    const parsed = parsePermission(permission)
    if (parsed) {
      console.log(`📊 Parsed value: ${parsed.value}`)
      console.log(`✓ Can CREATE:`, !!(parsed.value & PermissionAction.CREATE))
      console.log(`✓ Can EDIT:`, !!(parsed.value & PermissionAction.EDIT))
      console.log(`✓ Can DELETE:`, !!(parsed.value & PermissionAction.DELETE))
      console.log(`✓ Can BLOCK:`, !!(parsed.value & PermissionAction.BLOCK))
    }
  }
  
  console.groupEnd()
}
