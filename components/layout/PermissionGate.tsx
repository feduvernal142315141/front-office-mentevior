

"use client"

import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { usePermission } from "@/lib/hooks/use-permission"
import type { ReactNode } from "react"

interface PermissionGateProps {
  children: ReactNode

  module: PermissionModule | string

  action?: PermissionAction

  fallback?: ReactNode
}

export function PermissionGate({
  children,
  module,
  action,
  fallback = null
}: PermissionGateProps) {
  const { can, view } = usePermission()
  

  if (action !== undefined) {
    return can(module, action) ? <>{children}</> : <>{fallback}</>
  }

  return view(module) ? <>{children}</> : <>{fallback}</>
}
