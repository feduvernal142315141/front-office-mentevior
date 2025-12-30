"use client"

import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { Button } from "@/components/custom/Button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { RolesTable } from "./components/RolesTable"
import { useEffect } from "react"

export default function RolesPage() {
  const router = useRouter()
  const { view } = usePermission()
  const canView = view(PermissionModule.ROLE)

  useEffect(() => {
    if (!canView) {
      router.replace("/dashboard")
    }
  }, [canView, router])

  if (!canView) {
    return null
  }

  return (
    <div className="p-6 pb-[300px]">
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
