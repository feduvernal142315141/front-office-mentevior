
import { getPermissionId, getPermissionName } from "@/lib/constants/permissions-map"
import { parsePermission } from "@/lib/utils/permissions-new"
import { isHiddenPermissionModule } from "@/lib/constants/hidden-modules"

export interface PermissionBackendFormat {
  permissionId: string
  actionsValue: number
}

export function permissionsToBackend(
  frontendPermissions: string[]
): PermissionBackendFormat[] {
  const backendPermissions: PermissionBackendFormat[] = []
  
  for (const permission of frontendPermissions) {
    const parsed = parsePermission(permission)
    if (!parsed) {
      console.warn(`Invalid permission format: ${permission}`)
      continue
    }

    if (isHiddenPermissionModule(parsed.module)) {
      continue
    }
    
    const permissionId = getPermissionId(parsed.module)
    
    if (!permissionId) {
      console.warn(`Permission ID not found for module: ${parsed.module}`)
      continue
    }
    
    backendPermissions.push({
      permissionId,
      actionsValue: parsed.value,
    })
  }
  
  return backendPermissions
}


export function permissionsToFrontend(
  backendPermissions: PermissionBackendFormat[]
): string[] {
  const frontendPermissions: string[] = []
  
  for (const permission of backendPermissions) {
    const moduleName = getPermissionName(permission.permissionId)
    
    if (!moduleName) {
      console.warn(`Module name not found for permission ID: ${permission.permissionId}`)
      continue
    }

    if (isHiddenPermissionModule(moduleName)) {
      continue
    }
    
    frontendPermissions.push(`${moduleName}-${permission.actionsValue}`)
  }
  
  return frontendPermissions
}
