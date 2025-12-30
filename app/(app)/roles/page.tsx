"use client"

import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { redirect } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { Button } from "@/components/custom/Button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { RolesTable } from "./components/RolesTable"

export default function RolesPage() {
  const { view } = usePermission()

  if (!view(PermissionModule.ROLE)) {
    redirect("/dashboard")
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-2">
              Manage roles and control access to modules and features
            </p>
          </div>

          <PermissionGate module={PermissionModule.ROLE} action={PermissionAction.CREATE}>
            <Link href="/roles/create">
              <Button className="gap-2 flex items-center" variant="primary">
                <Plus className="w-4 h-4" />
                Create Role
              </Button>
            </Link>
          </PermissionGate>
        </div>

        <RolesTable />
      </div>
    </div>
  )
}
