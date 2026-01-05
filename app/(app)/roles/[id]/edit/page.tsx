"use client"

import { use, useEffect } from "react"
import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { RoleForm } from "../../components/RoleForm"

interface EditRolePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditRolePage({ params }: EditRolePageProps) {
  const router = useRouter()
  const { edit } = usePermission()
  const { id } = use(params)
  const canEdit = edit(PermissionModule.ROLE)

  useEffect(() => {
    if (!canEdit) {
      router.replace("/dashboard")
    }
  }, [canEdit, router])

  if (!canEdit) {
    return null
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
            Edit Role
          </h1>
          <p className="text-slate-600 mt-2">
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
