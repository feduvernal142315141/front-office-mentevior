"use client"

import { Sliders } from "lucide-react"

export function ClientServicePlanHeader() {
  return (
    <div className="mb-8 flex items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
          <Sliders className="h-8 w-8 text-[#037ECC]" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
            Client Service Plan
          </h1>
          <p className="mt-1 text-slate-600">Configure the service plan for this client</p>
        </div>
      </div>
    </div>
  )
}
