
import { useMemo } from "react"
import { navItems, type NavItem } from "@/components/layout/nav-items"
import { useAuthStore } from "@/lib/store/auth.store"
import { permissionsToObject } from "@/lib/utils/permissions-new"
import { PermissionModule } from "@/lib/utils/permissions-new"

const SIDEBAR_TO_PERMISSION_MAP: Record<string, string> = {
  "/dashboard": "dashboard", 
  "/users": PermissionModule.USERS_PROVIDERS,
  "/roles": PermissionModule.ROLE,
  "/clients": PermissionModule.CLIENTS,
  "/schedules": PermissionModule.SCHEDULE,
  "/session-note": PermissionModule.SESSION_NOTE,
  "/clinical-monthly": PermissionModule.CLINICAL_MONTHLY,
  "/monthly-supervisions": PermissionModule.MONTHLY_SUPERVISIONS,
  "/service-log": PermissionModule.SERVICE_LOG,
  "/assessment": PermissionModule.ASSESSMENT,
  "/behavior-plan": PermissionModule.BEHAVIOR_PLAN,
  "/my-company": PermissionModule.MY_COMPANY,
  "/data-collection": PermissionModule.DATA_COLLECTION,
  "/signatures-caregiver": PermissionModule.SIGNATURES_CAREGIVER,
  "/template-documents": PermissionModule.TEMPLATE_DOCUMENTS,
  "/clinical-documents": PermissionModule.CLINICAL_DOCUMENTS,
  "/hr-documents": PermissionModule.HR_DOCUMENTS,
  "/agreements": PermissionModule.AGREEMENTS,
  "/applicants": PermissionModule.APPLICANTS,
  "/billing": PermissionModule.BILLING,
  "/configuration": PermissionModule.CONFIGURATION,
}

export function useFilteredNavItems(): NavItem[] {
  const user = useAuthStore((state) => state.user)
  
  const filteredItems = useMemo(() => {
    if (!user) {
      return []
    }
    
    const permissionsObj = permissionsToObject(user.permissions || [])
    
    return navItems.filter((item) => {
      if (item.href === "/dashboard") {
        return true
      }
      
      const module = SIDEBAR_TO_PERMISSION_MAP[item.href]
      
      if (!module) {
        return false
      }
      
      const modulePermissions = permissionsObj[module] || 0
      
      return modulePermissions > 0
    })
  }, [user])
  
  return filteredItems
}


export function useCanViewModule(href: string): boolean {
  const user = useAuthStore((state) => state.user)
  
  return useMemo(() => {
    if (!user) return false
    
    if (href === "/dashboard") return true
    
    const module = SIDEBAR_TO_PERMISSION_MAP[href]
    if (!module) return false
    
    const permissionsObj = permissionsToObject(user.permissions || [])
    const modulePermissions = permissionsObj[module] || 0
    
    return modulePermissions > 0
  }, [user, href])
}
