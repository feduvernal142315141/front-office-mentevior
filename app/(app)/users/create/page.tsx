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
      <div className="max-w-6xl mx-auto">
        <Card variant="elevated" padding="lg">
          <UserForm />
        </Card>
      </div>
    </div>
  )
}
