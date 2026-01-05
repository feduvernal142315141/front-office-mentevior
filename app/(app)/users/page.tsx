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
import { Plus, UserCog } from "lucide-react"
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
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <UserCog className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Users & Permissions
              </h1>
              <p className="text-slate-600 mt-2">
                Manage your company's users and their roles
              </p>
            </div>
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
