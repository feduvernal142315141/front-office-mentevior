"use client"

import { usePermission } from "@/lib/hooks/use-permission"
import type { PermissionModule } from "@/lib/utils/permissions-new"

export interface ModulePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canBlock: boolean
}

/** Permisos CRUD de un módulo — patrón estándar para listas, formularios y modales. */
export function useModulePermissions(module: PermissionModule | string): ModulePermissions {
  const { view, create, edit, remove, block } = usePermission()

  return {
    canView: view(module),
    canCreate: create(module),
    canEdit: edit(module),
    canDelete: remove(module),
    canBlock: block(module),
  }
}
