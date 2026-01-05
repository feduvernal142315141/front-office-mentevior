"use client"

import { useAuth } from "@/lib/hooks/use-auth"
import { Gauge } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  console.log("Authenticated user:", user)
  
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Gauge className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Welcome back! Here's your overview</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
              <Gauge className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Dashboard Coming Soon</h2>
            <p className="text-slate-600">
              Analytics, charts, and key metrics will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}