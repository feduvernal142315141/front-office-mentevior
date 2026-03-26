"use client"

import { usePermission } from "@/lib/hooks/use-permission"
import { PermissionModule, type PermissionAction } from "@/lib/utils/permissions-new"

type PermissionChecker = (module: PermissionModule | string) => boolean

function withBillingFallback(checkPermission: PermissionChecker): boolean {
  // TODO(front-office-mentevior): Remove BILLING fallback when backend exposes real PAYERS permission id mapping.
  return checkPermission(PermissionModule.PAYERS) || checkPermission(PermissionModule.BILLING)
}

function withBillingActionFallback(
  checkPermission: (module: PermissionModule | string, action: PermissionAction) => boolean,
  action: PermissionAction,
): boolean {
  // TODO(front-office-mentevior): Remove BILLING fallback when backend exposes real PAYERS permission id mapping.
  return (
    checkPermission(PermissionModule.PAYERS, action) ||
    checkPermission(PermissionModule.BILLING, action)
  )
}

export function usePayersPermissionFallback() {
  const { can, view, create, edit, remove } = usePermission()

  return {
    canViewPayers: withBillingFallback(view),
    canCreatePayers: withBillingFallback(create),
    canEditPayers: withBillingFallback(edit),
    canDeletePayers: withBillingFallback(remove),
    canManagePayers: withBillingFallback(edit),
    canPayersAction: (action: PermissionAction) => withBillingActionFallback(can, action),
  }
}
