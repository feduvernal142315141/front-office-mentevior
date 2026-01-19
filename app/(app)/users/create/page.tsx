"use client"

import { PermissionModule } from "@/lib/utils/permissions-new"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { UserForm } from "../components/UserForm"
import { Card } from "@/components/custom/Card"
import { useEffect } from "react"
import { useRoles } from "@/lib/modules/roles/hooks/use-roles"
import { AlertTriangle, Shield } from "lucide-react"
import { Button } from "@/components/custom/Button"

export default function CreateUserPage() {
  const router = useRouter()
  const { create } = usePermission()
  const canCreate = create(PermissionModule.USERS_PROVIDERS)
  const { roles, isLoading: isLoadingRoles } = useRoles()

  useEffect(() => {
    if (!canCreate) {
      router.replace("/dashboard")
    }
  }, [canCreate, router])

  useEffect(() => {
    if (!isLoadingRoles && roles.length === 0) {
      const timer = setTimeout(() => {
        router.replace("/my-company/roles?from=users")
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isLoadingRoles, roles, router])

  if (!canCreate || isLoadingRoles) {
    return null
  }

  if (roles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 flex items-center justify-center">
        <Card variant="elevated" padding="lg" className="max-w-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Roles Available</h2>
            <p className="text-gray-600 mb-6">
              You need to create at least one role before adding users to your organization.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/my-company/roles")}
              className="w-full gap-2 flex items-center justify-center"
            >
              <Shield className="w-4 h-4" />
              Go to Roles
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
            Create New User
          </h1>
          <p className="text-slate-600 mt-2">Add a new user to your organization</p>
        </div>
        
        <Card variant="elevated" padding="lg">
          <UserForm />
        </Card>
      </div>
    </div>
  )
}
