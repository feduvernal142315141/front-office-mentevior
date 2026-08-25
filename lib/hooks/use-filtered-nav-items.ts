import { useMemo } from "react"
import { navItems, type NavItem } from "@/components/layout/nav-items"
import { useAuthStore } from "@/lib/store/auth.store"
import { permissionsToObject, PermissionModule } from "@/lib/utils/permissions-new"
import {
  PARENT_TO_CHILDREN_MAP,
  ROUTE_TO_PERMISSION_MAP,
} from "@/lib/constants/route-permissions"

const SIDEBAR_TO_PERMISSION_MAP = ROUTE_TO_PERMISSION_MAP

/**
 * Padres visuales cuyos hijos NO cuelgan de su ruta.
 *
 * `Clinical Options` agrupa módulos que conservan sus URLs originales
 * (`/clients`, `/users`…), así que no se pueden descubrir por prefijo como sí se
 * hace con `/data-collection/*`. Se listan explícitamente.
 */
const VISUAL_PARENT_CHILDREN: Record<string, string[]> = {
  "/clinical-options": [
    "/clients",
    "/users",
    "/session-note",
    "/schedules",
    "/clinical-monthly",
    "/monthly-supervisions",
    "/service-log",
    "/assessment",
  ],
}

/**
 * Helper function to check if user has permission to any deep children routes
 * Deep children are routes like /data-collection/datasheets that are nested under /data-collection
 */
function hasDeepChildrenPermission(baseHref: string, permissionsObj: Record<string, number>): boolean {
  // Special case: /my-company/documents has Clinical Documents and HR Documents as children
  if (baseHref === "/my-company/documents") {
    const clinicalPerms = permissionsObj[PermissionModule.CLINICAL_DOCUMENTS] || 0
    const hrPerms = permissionsObj[PermissionModule.HR_DOCUMENTS] || 0
    return clinicalPerms > 0 || hrPerms > 0
  }

  const explicitChildren = VISUAL_PARENT_CHILDREN[baseHref]
  if (explicitChildren) {
    return explicitChildren.some((route) => {
      const module = SIDEBAR_TO_PERMISSION_MAP[route]
      return module ? (permissionsObj[module] || 0) > 0 : false
    })
  }

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
