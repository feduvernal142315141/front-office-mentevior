"use client"

import { use } from "react"
import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { redirect } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { RoleForm } from "../../components/RoleForm"

interface EditRolePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditRolePage({ params }: EditRolePageProps) {
  const { edit } = usePermission()
  const { id } = use(params)

  if (!edit(PermissionModule.ROLE)) {
    redirect("/dashboard")
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Role</h1>
          <p className="text-gray-600 mt-2">
            Update role capabilities and settings
          </p>
        </div>

        <PermissionGate module={PermissionModule.ROLE} action={PermissionAction.EDIT}>
          <RoleForm roleId={id} />
        </PermissionGate>
      </div>
    </div>
  )
}
