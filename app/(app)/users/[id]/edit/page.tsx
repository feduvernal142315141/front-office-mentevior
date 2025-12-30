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
        <Card variant="elevated" padding="lg">
          <UserForm userId={id} />
        </Card>
      </div>
    </div>
  )
}
