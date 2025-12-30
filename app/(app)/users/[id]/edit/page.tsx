"use client"

import { use } from "react"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { redirect } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { UserForm } from "../../components/UserForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { edit } = usePermission()
  const { id } = use(params)

  if (!edit(PermissionModule.USERS_PROVIDERS)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/users">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600 mt-2">
            Update user information and permissions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <UserForm userId={id} />
        </div>
      </div>
    </div>
  )
}
