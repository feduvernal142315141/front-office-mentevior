"use client"

import { PermissionModule } from "@/lib/utils/permissions-new"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { RoleForm } from "../components/RoleForm"
import { useEffect } from "react"

export default function CreateRolePage() {
  const router = useRouter()
  const { create } = usePermission()
  const canCreate = create(PermissionModule.ROLE)

  useEffect(() => {
    if (!canCreate) {
      router.replace("/dashboard")
    }
  }, [canCreate, router])

  if (!canCreate) {
    return null
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>          
        </div>

        <RoleForm />
      </div>
    </div>
  )
}
