"use client"

import { use, useEffect } from "react"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { useRouter } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { UserForm } from "../../components/UserForm"
import { Card } from "@/components/custom/Card"

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter()
  const { edit } = usePermission()
  const { id } = use(params)
  const canEdit = edit(PermissionModule.USERS_PROVIDERS)

  useEffect(() => {
    if (!canEdit) {
      router.replace("/dashboard")
    }
  }, [canEdit, router])

  if (!canEdit) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
            Edit User
          </h1>
          <p className="text-slate-600 mt-2">Update user information and permissions</p>
        </div>
        
        <Card variant="elevated" padding="lg">
          <UserForm userId={id} />
        </Card>
      </div>
    </div>
  )
}
