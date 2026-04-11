"use client"

import { Eye } from "lucide-react"
import { useSupervisionConfig } from "@/lib/modules/supervision-config/hooks/use-supervision-config"
import { SupervisionConfigForm } from "./components/SupervisionConfigForm"
import { SupervisionConfigSkeleton } from "./components/SupervisionConfigSkeleton"

export default function SupervisionPage() {
  const { config, isLoading } = useSupervisionConfig()

  if (isLoading) {
    return <SupervisionConfigSkeleton />
  }

  return (
    <div className="bg-gray-50/50 p-6 pb-28">
      <div className="mx-auto max-w-5xl xl:max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <Eye className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Supervision
            </h1>
            <p className="mt-1 text-slate-600">Configure supervision event settings</p>
          </div>
        </div>

        <SupervisionConfigForm config={config} />
      </div>
    </div>
  )
}
