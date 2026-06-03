"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardList, BarChart3, Sliders, ArrowLeft } from "lucide-react"

import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import { Button } from "@/components/custom/Button"

import {
  ConfigurationSidebar,
  type ConfigurationSection,
} from "./ConfigurationSidebar"
import { ServicePlanContent } from "./ServicePlanContent"

interface ClientConfigurationLayoutProps {
  clientId: string
  clientServicePlanId: string | null
}

export function ClientConfigurationLayout({ clientId, clientServicePlanId }: ClientConfigurationLayoutProps) {
  const router = useRouter()
  const { client, isLoading } = useClientById(clientId)
  const [activeSectionId, setActiveSectionId] = useState("service-plan")

  const sections: ConfigurationSection[] = useMemo(
    () => [
      {
        id: "service-plan",
        title: "Service Plan",
        icon: <ClipboardList />,
      },
      {
        id: "data-collection",
        title: "Data Collection",
        icon: <BarChart3 />,
        disabled: true,
      },
    ],
    []
  )

  if (isLoading || !client) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Loading client...</div>
      </div>
    )
  }

  const clientName = `${client.firstName || ""} ${client.lastName || ""}`.trim()

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
              <Sliders className="h-7 w-7 text-[#037ECC]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
                {clientName}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Service plan and data collection configuration
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1">
        <ConfigurationSidebar
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionClick={setActiveSectionId}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-36">
          <div className="mx-auto py-8 px-8 w-full max-w-6xl 2xl:max-w-[1440px] min-[1800px]:max-w-[1680px] min-[2200px]:max-w-[1960px]">
            {activeSectionId === "service-plan" && (
              <ServicePlanContent clientId={clientId} clientServicePlanId={clientServicePlanId} />
            )}

            {activeSectionId === "data-collection" && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-600">Data Collection</p>
                <p className="text-sm text-slate-500 mt-1">Coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/clients")}
              className="gap-2 flex items-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
