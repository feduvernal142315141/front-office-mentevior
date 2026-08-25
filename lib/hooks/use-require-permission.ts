"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionAction, type PermissionModule } from "@/lib/utils/permissions-new"

/**
 * Redirige a /dashboard si el usuario no tiene la acción requerida.
 * Usar en páginas create/edit y vistas que exigen un permiso específico.
 */
export function useRequirePermission(
  module: PermissionModule | string,
  action: PermissionAction = PermissionAction.READ,
): boolean {
  const router = useRouter()
  const { can, view } = usePermission()

  const allowed =
    action === PermissionAction.READ ? view(module) : can(module, action)

  useEffect(() => {
    if (!allowed) {
      router.replace("/dashboard")
    }
  }, [allowed, router])

  return allowed
}
