
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
  "/billing": PermissionModule.BILLING,
  
  "/behavior-plan/maladaptive-behaviors": PermissionModule.MALADAPTIVE_BEHAVIORS,
  "/behavior-plan/replacement-programs": PermissionModule.REPLACEMENT_PROGRAMS,
  "/behavior-plan/caregiver-programs": PermissionModule.CAREGIVER_PROGRAMS,

  "/my-company/account-profile": PermissionModule.MY_COMPANY,
  "/my-company/address": PermissionModule.MY_COMPANY,
  "/my-company/billing": PermissionModule.BILLING,
  "/my-company/credentials": PermissionModule.MY_COMPANY,
  "/my-company/events": PermissionModule.MY_COMPANY,
  "/my-company/physicians": PermissionModule.MY_COMPANY,
  "/my-company/service-plans": PermissionModule.MY_COMPANY,
  
  "/clinical-documents": PermissionModule.CLINICAL_DOCUMENTS,
  "/hr-documents": PermissionModule.HR_DOCUMENTS,
  "/agreements": PermissionModule.AGREEMENTS,
  "/applicants": PermissionModule.APPLICANTS,
  
  // Data Collection children (real permissions)
  "/data-collection/datasheets": PermissionModule.DATASHEETS,
  "/data-collection/onsite-collection": PermissionModule.ON_SITE_COLLECTION,
  "/data-collection/charts": PermissionModule.CHARTS,
  "/data-collection/data-analysis": PermissionModule.DATA_ANALYSIS,
  "/data-collection/raw-data": PermissionModule.RAW_DATA,

  // Signatures Caregiver children (real permissions)
  "/signatures-caregiver/check": PermissionModule.CHECK,
  "/signatures-caregiver/sign": PermissionModule.SIGN,
  
  // Template Documents children (real permissions)
  "/template-documents/session-note": PermissionModule.SESSION_NOTE_CONFIGURATION,
  "/template-documents/service-log": PermissionModule.SERVICE_LOG_CONFIGURATION,
  "/template-documents/clinical-monthly": PermissionModule.CLINICAL_MONTHLY_CONFIGURATION,
  "/template-documents/monthly-supervision": PermissionModule.MONTHLY_SUPERVISIONS_CONFIGURATION,
  "/template-documents/assessment": PermissionModule.ASSESSMENT_CONFIGURATION,
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
      if (modulePermissions > 0) {
        return true
      }

      if (item.children && item.children.length > 0) {
        return item.children.some((child) => {
          const childModule = SIDEBAR_TO_PERMISSION_MAP[child.href]
          if (!childModule) return false
          
          const childPermissions = permissionsObj[childModule] || 0
          return childPermissions > 0
        })
      }
      
      return false
    }).map((item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter((child) => {
          const childModule = SIDEBAR_TO_PERMISSION_MAP[child.href]
          if (!childModule) return false
          
          const childPermissions = permissionsObj[childModule] || 0
          return childPermissions > 0
        })
        
        return {
          ...item,
          children: filteredChildren
        }
      }
      
      return item
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
