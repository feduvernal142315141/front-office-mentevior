"use client"

import { PermissionModule } from "@/lib/utils/permissions-new"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { UserForm } from "../components/UserForm"
import { Card } from "@/components/custom/Card"
import { useEffect } from "react"

export default function CreateUserPage() {
  const router = useRouter()
  const { create } = usePermission()
  const canCreate = create(PermissionModule.USERS_PROVIDERS)

  useEffect(() => {
    if (!canCreate) {
      router.replace("/dashboard")
    }
  }, [canCreate, router])

  if (!canCreate) {
    return null
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
