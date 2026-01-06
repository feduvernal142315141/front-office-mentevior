"use client"

import { User } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"

export default function MyProfilePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="p-6 pb-[300px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <User className="h-8 w-8 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-slate-600 mt-2">
                Manage your personal information and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Profile Settings Coming Soon
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              This section is under development. You'll be able to manage your profile, update your information, and customize your preferences here.
            </p>
            {user && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 inline-block">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Logged in as:</span> {user.name || user.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}