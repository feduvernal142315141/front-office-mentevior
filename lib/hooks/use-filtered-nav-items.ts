
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
  "/my-company": PermissionModule.MY_COMPANY,
  
  // Behavior Plan children (real permissions)
  "/behavior-plan/maladaptive-behaviors": PermissionModule.MALADAPTIVE_BEHAVIORS,
  "/behavior-plan/replacement-programs": PermissionModule.REPLACEMENT_PROGRAMS,
  "/behavior-plan/caregiver-programs": PermissionModule.CAREGIVER_PROGRAMS,

  "/my-company/account-profile": PermissionModule.MY_COMPANY,
  "/my-company/address": PermissionModule.MY_COMPANY,
  "/my-company/credentials": PermissionModule.MY_COMPANY,
  "/my-company/physicians": PermissionModule.MY_COMPANY,
  "/my-company/service-plans": PermissionModule.MY_COMPANY,
  
  // Events children (real permissions, under My Company)
  "/my-company/events/appointment": PermissionModule.APPOINTMENT,
  "/my-company/events/service-plan": PermissionModule.SERVICE_PLAN,
  "/my-company/events/supervision": PermissionModule.SUPERVISION,
  
  // Billing children (real permissions, under My Company)
  "/my-company/billing/services-pending": PermissionModule.SERVICES_PENDING_BILLING,
  "/my-company/billing/billed-claims": PermissionModule.BILLED_CLAIMS,
  
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

  // Signatures Caregiver (now a simple module)
  "/signatures-caregiver": PermissionModule.SIGNATURES_CAREGIVER,
  
  // Template Documents children (real permissions)
  "/template-documents/session-note": PermissionModule.SESSION_NOTE_CONFIGURATION,
  "/template-documents/service-log": PermissionModule.SERVICE_LOG_CONFIGURATION,
  "/template-documents/clinical-monthly": PermissionModule.CLINICAL_MONTHLY_CONFIGURATION,
  "/template-documents/monthly-supervision": PermissionModule.MONTHLY_SUPERVISIONS_CONFIGURATION,
  "/template-documents/assessment": PermissionModule.ASSESSMENT_CONFIGURATION,
}

/**
 * Helper function to check if user has permission to any deep children routes
 * Deep children are routes like /data-collection/datasheets that are nested under /data-collection
 */
function hasDeepChildrenPermission(baseHref: string, permissionsObj: Record<string, number>): boolean {
  // Get all routes that start with the baseHref
  const deepChildRoutes = Object.keys(SIDEBAR_TO_PERMISSION_MAP).filter(
    route => route.startsWith(baseHref + "/")
  )
  
  // Check if user has permission to any of these deep child routes
  return deepChildRoutes.some(route => {
    const module = SIDEBAR_TO_PERMISSION_MAP[route]
    if (!module) return false
    
    const permissions = permissionsObj[module] || 0
    return permissions > 0
  })
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
      
      // If module has direct permission mapping, check it
      if (module) {
        const modulePermissions = permissionsObj[module] || 0
        if (modulePermissions > 0) {
          return true
        }
      }

      // If no direct permission OR item has children, check children
      if (item.children && item.children.length > 0) {
        return item.children.some((child) => {
          const childModule = SIDEBAR_TO_PERMISSION_MAP[child.href]
          
          // Direct child has permission
          if (childModule) {
            const childPermissions = permissionsObj[childModule] || 0
            if (childPermissions > 0) return true
          }
          
          // Check if child has deep children (hasDeepChildren flag)
          if (child.hasDeepChildren) {
            return hasDeepChildrenPermission(child.href, permissionsObj)
          }
          
          return false
        })
      }
      
      // If no module mapping and no children, hide it
      if (!module) {
        return false
      }
      
      return false
    }).map((item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = item.children.filter((child) => {
          const childModule = SIDEBAR_TO_PERMISSION_MAP[child.href]
          
          // Direct child has permission
          if (childModule) {
            const childPermissions = permissionsObj[childModule] || 0
            if (childPermissions > 0) return true
          }
          
          // Check if child has deep children and user has permission to any
          if (child.hasDeepChildren) {
            return hasDeepChildrenPermission(child.href, permissionsObj)
          }
          
          return false
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
    const permissionsObj = permissionsToObject(user.permissions || [])
    
    // If module exists in map, check direct permission
    if (module) {
      const modulePermissions = permissionsObj[module] || 0
      return modulePermissions > 0
    }
    
    // If module doesn't exist in map, it might be a visual parent with deep children
    // Check if user has permission to any deep child route
    return hasDeepChildrenPermission(href, permissionsObj)
  }, [user, href])
}
