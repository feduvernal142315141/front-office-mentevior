"use client"

import { useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"
import {
  hasModulePermission,
  permissionsToObject,
  PermissionAction,
} from "@/lib/utils/permissions-new"
import {
  PARENT_TO_CHILDREN_MAP,
  resolveRouteModule,
  resolveRouteRequiredAction,
  ROUTE_TO_PERMISSION_MAP,
} from "@/lib/constants/route-permissions"

function hasDeepChildrenPermission(
  baseRoute: string,
  permissionsObj: Record<string, number>,
): boolean {
  const deepChildren = PARENT_TO_CHILDREN_MAP[baseRoute]
  if (!deepChildren?.length) return false

  return deepChildren.some((deepChildRoute) => {
    const deepChildModule = ROUTE_TO_PERMISSION_MAP[deepChildRoute]
    if (!deepChildModule) return false
    return (permissionsObj[deepChildModule] || 0) > 0
  })
}

function hasChildRoutePermission(
  baseRoute: string,
  permissionsObj: Record<string, number>,
): boolean {
  const childRoutes = PARENT_TO_CHILDREN_MAP[baseRoute]
  if (!childRoutes?.length) return false

  return childRoutes.some((childRoute) => {
    const childModule = ROUTE_TO_PERMISSION_MAP[childRoute]
    if (childModule) return (permissionsObj[childModule] || 0) > 0
    return hasDeepChildrenPermission(childRoute, permissionsObj)
  })
}

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  const hasAccess = useMemo(() => {
    if (!user) return false

    const alwaysOpen =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/my-profile") ||
      pathname.startsWith("/change-password")
    if (alwaysOpen) return true

    const permissions = user.permissions || []
    const permissionsObj = permissionsToObject(permissions)
    const module = resolveRouteModule(pathname)
    const baseRoute = `/${pathname.split("/").filter(Boolean)[0]}`

    if (!module && PARENT_TO_CHILDREN_MAP[baseRoute]) {
      return hasChildRoutePermission(baseRoute, permissionsObj)
    }

    if (!module) {
      console.warn(`No permission mapping found for route: ${pathname}`)
      return true
    }

    const requiredAction = resolveRouteRequiredAction(pathname)
    if (requiredAction) {
      return hasModulePermission(permissions, module, requiredAction)
    }

    if ((permissionsObj[module] || 0) > 0) return true

    return hasChildRoutePermission(baseRoute, permissionsObj)
  }, [pathname, user])

  useEffect(() => {
    if (!hasAccess && user) {
      const module = resolveRouteModule(pathname)
      console.warn(`Access denied to ${pathname} (module: ${module}). Redirecting to dashboard.`)
      router.replace("/dashboard")
    }
  }, [hasAccess, pathname, user, router])

  if (!hasAccess) return null

  return <>{children}</>
}
