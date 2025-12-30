"use client"

import { PermissionModule } from "@/lib/utils/permissions-new"
import { redirect } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { RoleForm } from "../components/RoleForm"

export default function CreateRolePage() {
  const { create } = usePermission()

  if (!create(PermissionModule.ROLE)) {
    redirect("/dashboard")
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>
          <p className="text-gray-600 mt-2">
            Define a new role with custom capabilities for your team
          </p>
        </div>

        <RoleForm />
      </div>
    </div>
  )
}
