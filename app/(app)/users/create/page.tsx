"use client"

import { PermissionModule } from "@/lib/utils/permissions-new"
import { redirect } from "next/navigation"
import { usePermission } from "@/lib/hooks/use-permission"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { UserForm } from "../components/UserForm"

export default function CreateUserPage() {
  const { create } = usePermission()

  if (!create(PermissionModule.USERS_PROVIDERS)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/users"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Provider</h1>
          <p className="text-gray-600 mt-2">
            Add a new user to your company with assigned role and permissions
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <UserForm />
        </div>
      </div>
    </div>
  )
}
