"use client"

import { PermissionModule, PermissionAction } from "@/lib/utils/permissions-new"
import { PermissionGate } from "@/components/layout/PermissionGate"
import { useRouter, useSearchParams } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { Button } from "@/components/custom/Button"
import { Plus, Shield, Info } from "lucide-react"
import Link from "next/link"
import { RolesTable } from "./components/RolesTable"
import { useEffect, useState } from "react"

export default function RolesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { view } = usePermission()
  const canView = view(PermissionModule.ROLE)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (!canView) {
      router.replace("/dashboard")
    }
  }, [canView, router])

  useEffect(() => {
    const from = searchParams.get("from")
    if (from === "users") {
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 8000)
    }
  }, [searchParams])

  if (!canView) {
    return null
  }

  return (
    <div className="p-6 pb-[300px]">
      <div className="max-w-7xl mx-auto">
        {showAlert && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">
                Create a role first to assign permissions to your users
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Once you have at least one role, you'll be able to create new users.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Shield className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                Roles & Permissions
              </h1>
              <p className="text-slate-600 mt-2">
                Manage roles and control access to modules and features
              </p>
            </div>
          </div>

          <PermissionGate module={PermissionModule.ROLE} action={PermissionAction.CREATE}>
            <Link href="/my-company/roles/create">
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
