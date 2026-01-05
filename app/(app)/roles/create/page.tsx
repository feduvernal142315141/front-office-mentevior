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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
            Create New Role
          </h1>
          <p className="text-slate-600 mt-2">Define permissions and access levels for this role</p>
        </div>

        <RoleForm />
      </div>
    </div>
  )
}
