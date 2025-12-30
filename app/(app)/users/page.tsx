/**
 * USERS LIST PAGE
 * Lista de usuarios de la compañía
 */

"use client"

import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { Button } from "@/components/custom/Button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { UsersTable } from "./components/UsersTable"
import { useEffect } from "react"

export default function UsersPage() {
  const router = useRouter()
  const { view } = usePermission()
  const canView = view(PermissionModule.USERS_PROVIDERS)

  useEffect(() => {
    if (!canView) {
      router.replace("/dashboard")
    }
  }, [canView, router])

  if (!canView) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 pb-[300px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users & Permissions</h1>
            <p className="text-gray-600 mt-2">
              Manage your company's users and their roles
            </p>
          </div>

          <PermissionGate module={PermissionModule.USERS_PROVIDERS} action={PermissionAction.CREATE}>
            <Link href="/users/create">
              <Button variant="primary" className="gap-2 flex items-center">
                <Plus className="w-4 h-4" />
                Create Provider
              </Button>
            </Link>
          </PermissionGate>
        </div>

        <UsersTable />
      </div>
    </div>
  )
}
