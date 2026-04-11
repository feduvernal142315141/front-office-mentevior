"use client"

import { ClipboardList } from "lucide-react"
import { useServicePlanConfig } from "@/lib/modules/service-plan-config/hooks/use-service-plan-config"
import { ServicePlanConfigForm } from "./components/ServicePlanConfigForm"
import { ServicePlanConfigSkeleton } from "./components/ServicePlanConfigSkeleton"

export default function ServicePlanPage() {
  const { config, isLoading } = useServicePlanConfig()

  if (isLoading) {
    return <ServicePlanConfigSkeleton />
  }

  return (
    <div className="bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl xl:max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <ClipboardList className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Service Plan
            </h1>
            <p className="mt-1 text-slate-600">Configure service delivery plans</p>
          </div>
        </div>

        <ServicePlanConfigForm config={config} />
      </div>
    </div>
  )
}
