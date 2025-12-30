
import { getPermissionId, getPermissionName } from "@/lib/constants/permissions-map"

export interface PermissionBackendFormat {
  permissionId: string
  actionsValue: number
}

export function permissionsToBackend(
  frontendPermissions: string[]
): PermissionBackendFormat[] {
  const backendPermissions: PermissionBackendFormat[] = []
  
  for (const permission of frontendPermissions) {
    const [moduleName, valueStr] = permission.split("-")
    const actionsValue = parseInt(valueStr, 10)
    
    if (!moduleName || isNaN(actionsValue)) {
      console.warn(`Invalid permission format: ${permission}`)
      continue
    }
    
    const permissionId = getPermissionId(moduleName)
    
    if (!permissionId) {
      console.warn(`Permission ID not found for module: ${moduleName}`)
      continue
    }
    
    backendPermissions.push({
      permissionId,
      actionsValue,
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
    
    frontendPermissions.push(`${moduleName}-${permission.actionsValue}`)
  }
  
  return frontendPermissions
}
