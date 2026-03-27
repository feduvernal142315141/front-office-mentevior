"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule, type PermissionAction } from "@/lib/utils/permissions-new"

function roleString(role: unknown): string {
  if (role == null) return ""
  if (typeof role === "string") return role
  if (typeof role === "object" && "name" in role && typeof (role as { name: unknown }).name === "string") {
    return (role as { name: string }).name
  }
  return String(role)
}

function isAdminLikeRole(role: unknown): boolean {
  const r = roleString(role).replace(/[\s_-]/g, "").toLowerCase()
  return r.includes("admin") || r.includes("superadmin")
}

/**
 * Misma regla que `app/(app)/my-company/billing/page.tsx`: muchos usuarios tienen
 * `services_pending_billing` (BILLING) pero el JWT aún no trae el permiso `payers` con el UUID nuevo.
 */
export function usePayersPermissionFallback() {
  const { user } = useAuth()
  const { can, view, create, edit, remove } = usePermission()

  const bypass = isAdminLikeRole(user?.role)

  const allow = (check: () => boolean) => bypass || check()

  const viewPayersOrBilling = () => view(PermissionModule.PAYERS) || view(PermissionModule.BILLING)
  const createPayersOrBilling = () => create(PermissionModule.PAYERS) || create(PermissionModule.BILLING)
  const editPayersOrBilling = () => edit(PermissionModule.PAYERS) || edit(PermissionModule.BILLING)
  const removePayersOrBilling = () => remove(PermissionModule.PAYERS) || remove(PermissionModule.BILLING)
  const canPayersOrBilling = (action: PermissionAction) =>
    can(PermissionModule.PAYERS, action) || can(PermissionModule.BILLING, action)

  return {
    canViewPayers: allow(viewPayersOrBilling),
    canCreatePayers: allow(createPayersOrBilling),
    canEditPayers: allow(editPayersOrBilling),
    canDeletePayers: allow(removePayersOrBilling),
    canManagePayers: allow(editPayersOrBilling),
    canPayersAction: (action: PermissionAction) => bypass || canPayersOrBilling(action),
  }
}
