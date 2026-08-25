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
  fallback = null,
}: PermissionGateProps) {
  const { can, view } = usePermission()

  if (action !== undefined) {
    return can(module, action) ? <>{children}</> : <>{fallback}</>
  }

  return view(module) ? <>{children}</> : <>{fallback}</>
}

interface ModuleGateProps {
  children: ReactNode
  module: PermissionModule | string
  fallback?: ReactNode
}

export function CreateGate({ children, module, fallback }: ModuleGateProps) {
  return (
    <PermissionGate module={module} action={PermissionAction.CREATE} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function EditGate({ children, module, fallback }: ModuleGateProps) {
  return (
    <PermissionGate module={module} action={PermissionAction.EDIT} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function DeleteGate({ children, module, fallback }: ModuleGateProps) {
  return (
    <PermissionGate module={module} action={PermissionAction.DELETE} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}
