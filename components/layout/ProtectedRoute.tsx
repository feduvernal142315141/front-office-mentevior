"use client"

import { useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"
import { permissionsToObject, PermissionModule } from "@/lib/utils/permissions-new"

const ROUTE_TO_PERMISSION_MAP: Record<string, string> = {
  "/dashboard": "dashboard", 
  "/users": PermissionModule.USERS_PROVIDERS,
  "/my-company/roles": PermissionModule.ROLE,
  "/clients": PermissionModule.CLIENTS,
  "/schedules": PermissionModule.SCHEDULE,
  "/session-note": PermissionModule.SESSION_NOTE,
  "/clinical-monthly": PermissionModule.CLINICAL_MONTHLY,
  "/monthly-supervisions": PermissionModule.MONTHLY_SUPERVISIONS,
  "/service-log": PermissionModule.SERVICE_LOG,
  "/assessment": PermissionModule.ASSESSMENT,
  
  // Behavior Plan children (real permissions)
  "/behavior-plan/maladaptive-behaviors": PermissionModule.MALADAPTIVE_BEHAVIORS,
  "/behavior-plan/replacement-programs": PermissionModule.REPLACEMENT_PROGRAMS,
  "/behavior-plan/caregiver-programs": PermissionModule.CAREGIVER_PROGRAMS,
  
  "/my-company": PermissionModule.MY_COMPANY,
  
  // Events children (real permissions, under My Company)
  "/my-company/events/appointment": PermissionModule.APPOINTMENT,
  "/my-company/events/service-plan": PermissionModule.SERVICE_PLAN,
  "/my-company/events/supervision": PermissionModule.SUPERVISION,
  
  // Billing children (real permissions, under My Company)
  "/my-company/billing/services-pending": PermissionModule.SERVICES_PENDING_BILLING,
  "/my-company/billing/billed-claims": PermissionModule.BILLED_CLAIMS,
  "/applicants": PermissionModule.APPLICANTS,
  "/my-profile": "my-profile", 
  "/change-password": "change-password",
  // Data Collection, Behavior Plan, Events, Billing, Signatures, Templates are visual parents - access is granted via children
  "/clinical-documents": PermissionModule.CLINICAL_DOCUMENTS,
  "/hr-documents": PermissionModule.HR_DOCUMENTS,
  "/agreements": PermissionModule.AGREEMENTS,
  
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

const PARENT_TO_CHILDREN_MAP: Record<string, string[]> = {
  "/my-company": [
    "/my-company/roles",
    "/my-company/account-profile",
    "/my-company/address",
    "/my-company/credentials",
    "/my-company/physicians",
    "/my-company/service-plans",
    "/my-company/events",
    "/my-company/billing",
    "/data-collection",  
    "/signatures-caregiver",  
    "/template-documents",  
    "/clinical-documents", 
    "/hr-documents", 
    "/agreements", 
    "/applicants",
  ],
  "/behavior-plan": [
    "/behavior-plan/maladaptive-behaviors",
    "/behavior-plan/replacement-programs",
    "/behavior-plan/caregiver-programs",
  ],
  "/my-company/events": [
    "/my-company/events/appointment",
    "/my-company/events/service-plan",
    "/my-company/events/supervision",
  ],
  "/my-company/billing": [
    "/my-company/billing/services-pending",
    "/my-company/billing/billed-claims",
  ],
  "/data-collection": [
    "/data-collection/datasheets",
    "/data-collection/onsite-collection",
    "/data-collection/charts",
    "/data-collection/data-analysis",
    "/data-collection/raw-data",
  ],
  "/template-documents": [
    "/template-documents/session-note",
    "/template-documents/service-log",
    "/template-documents/clinical-monthly",
    "/template-documents/monthly-supervision",
    "/template-documents/assessment",
  ],
}

/**
 * Helper function to check if user has permission to any deep children routes
 * Used when a child route is not a real permission (e.g., /data-collection)
 * but has nested children with real permissions (e.g., /data-collection/datasheets)
 */
function hasDeepChildrenPermission(
  baseRoute: string, 
  permissionsObj: Record<string, number>
): boolean {

  const deepChildren = PARENT_TO_CHILDREN_MAP[baseRoute]
  
  if (!deepChildren || deepChildren.length === 0) {
    return false
  }
  

  return deepChildren.some(deepChildRoute => {
    const deepChildModule = ROUTE_TO_PERMISSION_MAP[deepChildRoute]
    if (!deepChildModule) return false
    
    const deepChildPermissions = permissionsObj[deepChildModule] || 0
    return deepChildPermissions > 0
  })
}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  // Calcular si tiene acceso ANTES de renderizar
  const hasAccess = useMemo(() => {
    if (!user) {
      return false
    }

    // Extraer la ruta base (primera parte del path)
    // Ejemplo: /users/create -> /users, /roles/123/edit -> /roles
    const baseRoute = '/' + pathname.split('/').filter(Boolean)[0]

    // Dashboard siempre es accesible
    if (baseRoute === "/dashboard") {
      return true
    }

    // My Profile y Change Password siempre son accesibles
    if (baseRoute === "/my-profile" || baseRoute === "/change-password") {
      return true
    }

    // Obtener el módulo de permisos basado en la ruta base
    const module = ROUTE_TO_PERMISSION_MAP[baseRoute]

    // Si la ruta no está en el mapa, permitir acceso (rutas sin restricción)
    if (!module) {
      console.warn(`No permission mapping found for route: ${baseRoute}`)
      return true
    }

    // Verificar permisos
    const permissionsObj = permissionsToObject(user.permissions || [])
    
    // 1. Check parent permission
    const modulePermissions = permissionsObj[module] || 0
    if (modulePermissions > 0) {
      return true
    }

    // 2. If parent has no permission, check if user has permission to ANY child
    // This allows accessing "/my-company" if user has permission to "/roles" or any deep child
    const childRoutes = PARENT_TO_CHILDREN_MAP[baseRoute]
    if (childRoutes && childRoutes.length > 0) {
      return childRoutes.some((childRoute) => {
        const childModule = ROUTE_TO_PERMISSION_MAP[childRoute]
        
        // If child has direct permission, allow access
        if (childModule) {
          const childPermissions = permissionsObj[childModule] || 0
          if (childPermissions > 0) return true
        }
        
        // If child is not a real permission (e.g., /data-collection),
        // check if user has permission to any of its deep children
        if (!childModule) {
          return hasDeepChildrenPermission(childRoute, permissionsObj)
        }
        
        return false
      })
    }

    return false
  }, [pathname, user])

  // Efecto para redirigir si no tiene acceso
  useEffect(() => {
    if (!hasAccess && user) {
      const baseRoute = '/' + pathname.split('/').filter(Boolean)[0]
      const module = ROUTE_TO_PERMISSION_MAP[baseRoute]
      console.warn(`Access denied to ${pathname} (module: ${module}). Redirecting to dashboard.`)
      router.replace("/dashboard")
    }
  }, [hasAccess, pathname, user, router])

  // NO renderizar nada si no tiene acceso
  if (!hasAccess) {
    return null
  }

  // Solo renderizar si tiene acceso
  return <>{children}</>
}
