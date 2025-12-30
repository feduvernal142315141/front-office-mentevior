/**
 * USERS LIST PAGE
 * Lista de usuarios de la compañía
 */

"use client"

import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { redirect } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { UsersTable } from "./components/UsersTable"

export default function UsersPage() {
  const { view } = usePermission()

  if (!view(PermissionModule.USERS_PROVIDERS)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
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
              <Button className="gap-2">
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
