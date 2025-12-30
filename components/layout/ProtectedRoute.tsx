"use client"

import { useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"
import { permissionsToObject, PermissionModule } from "@/lib/utils/permissions-new"

const ROUTE_TO_PERMISSION_MAP: Record<string, string> = {
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
  "/applicants": PermissionModule.APPLICANTS,
  "/configuration": PermissionModule.CONFIGURATION,
  "/my-profile": "my-profile", // Siempre accesible
  "/change-password": "change-password", // Siempre accesible
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
    const modulePermissions = permissionsObj[module] || 0

    return modulePermissions > 0
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
