"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { 
  PermissionModule, 
  PermissionAction, 
  hasModulePermission, 
  canView as canViewModule, 
  canCreate as canCreateModule, 
  canEdit as canEditModule, 
  canDelete as canDeleteModule,
  canBlock as canBlockModule,
  debugPermissions 
} from "@/lib/utils/permissions-new"

export function usePermission() {
  const { user } = useAuth()
  
  const can = (module: PermissionModule | string, action: PermissionAction): boolean => {
    if (!user || !Array.isArray(user.permissions)) return false
    return hasModulePermission(user.permissions, module, action)
  }
  
  const view = (module: PermissionModule | string): boolean => {
    if (!user || !Array.isArray(user.permissions)) return false
    return canViewModule(user.permissions, module)
  }
  
  const create = (module: PermissionModule | string): boolean => {
    if (!user || !Array.isArray(user.permissions)) return false
    return canCreateModule(user.permissions, module)
  }
  
  const edit = (module: PermissionModule | string): boolean => {
    if (!user || !Array.isArray(user.permissions)) return false
    return canEditModule(user.permissions, module)
  }
  
  const remove = (module: PermissionModule | string): boolean => {
    if (!user || !Array.isArray(user.permissions)) return false
    return canDeleteModule(user.permissions, module)
  }
  
  const block = (module: PermissionModule | string): boolean => {
    if (!user || !Array.isArray(user.permissions)) return false
    return canBlockModule(user.permissions, module)
  }
  
  const debug = (module: PermissionModule | string): void => {
    if (!user || !Array.isArray(user.permissions)) {
      console.warn("⚠️ No user or permissions found")
      return
    }
    debugPermissions(user.permissions, module)
  }
  
  return {
    can,
    view,
    create,
    edit,
    remove,
    block,
    debug,
  }
}
