"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardList, BarChart3, Sliders, ArrowLeft } from "lucide-react"

import { useClientById } from "@/lib/modules/clients/hooks/use-client-by-id"
import { useClientServicePlanById } from "@/lib/modules/client-service-plan/hooks/use-client-service-plan-by-id"
import { useClientServicePlan } from "@/lib/modules/client-service-plan/hooks/use-client-service-plan"
import { useAlert } from "@/lib/contexts/alert-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/custom/Button"

import {
  ConfigurationSidebar,
  type ConfigurationSection,
} from "./ConfigurationSidebar"
import { ServicePlanContent } from "./ServicePlanContent"
import { DataCollectionContent, type NavigateToItemRequest } from "./DataCollectionContent"

interface ClientConfigurationLayoutProps {
  clientId: string
  clientServicePlanId: string | null
  initialSection?: string
}

export function ClientConfigurationLayout({ clientId, clientServicePlanId, initialSection }: ClientConfigurationLayoutProps) {
  const router = useRouter()
  const { client, isLoading } = useClientById(clientId)
  const alert = useAlert()

  // When navigating with section=data-collection but no spId, resolve it from the client
  const needsSpLookup = initialSection === "data-collection" && !clientServicePlanId
  const { clientServicePlan: resolvedPlan } = useClientServicePlan(needsSpLookup ? clientId : "")
  const resolvedSpId = clientServicePlanId ?? resolvedPlan?.id ?? null

  const [activeSectionId, setActiveSectionId] = useState(
    initialSection === "data-collection" && clientServicePlanId ? "data-collection" : "service-plan",
  )
  const [spId, setSpId] = useState<string | null>(resolvedSpId)
  const { clientServicePlan } = useClientServicePlanById(spId ?? "")

  // Once the resolved spId arrives, switch to data-collection
  useEffect(() => {
    if (needsSpLookup && resolvedPlan?.id && !spId) {
      setSpId(resolvedPlan.id)
      setActiveSectionId("data-collection")
    }
  }, [needsSpLookup, resolvedPlan?.id, spId])
  const [autoOpenItem, setAutoOpenItem] = useState<NavigateToItemRequest | null>(null)
  const isItemDirtyRef = useRef(false)

  const handleItemDirtyChange = useCallback((dirty: boolean) => {
    isItemDirtyRef.current = dirty
  }, [])

  const guardedSectionClick = useCallback((sectionId: string) => {
    if (!isItemDirtyRef.current) {
      setActiveSectionId(sectionId)
      return
    }
    alert.confirm({
      title: "Unsaved Changes",
      description: "You have unsaved changes. Save them before leaving or discard to continue without saving.",
      confirmText: "Save",
      cancelText: "Cancel",
      onConfirm: () => {
        const form = document.querySelector<HTMLFormElement>("form")
        form?.requestSubmit()
      },
      onCancel: () => {
        isItemDirtyRef.current = false
        setActiveSectionId(sectionId)
      },
    })
  }, [alert])

  const handleNavigateToItem = useCallback((request: NavigateToItemRequest) => {
    setAutoOpenItem(request)
    setActiveSectionId("service-plan")
  }, [])


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
        disabled: !spId,
      },
    ],
    [spId]
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
    <div className="h-full bg-gray-50/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 px-6 py-5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <Sliders className="h-6 w-6 text-[#037ECC]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent truncate">
                {clientName}
              </h1>
              {clientServicePlan && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-medium text-slate-600">{clientServicePlan.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      clientServicePlan.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }
                  >
                    {clientServicePlan.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Service plan and data collection configuration
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ConfigurationSidebar
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionClick={guardedSectionClick}
        />

        <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar pb-36">
          <div className="py-6 px-6">
            {activeSectionId === "service-plan" && (
              <ServicePlanContent
                clientId={clientId}
                clientServicePlanId={clientServicePlanId}
                onServicePlanAssigned={setSpId}
                autoOpenItem={autoOpenItem}
                onAutoOpenItemConsumed={() => setAutoOpenItem(null)}
                onItemDirtyChange={handleItemDirtyChange}
              />
            )}

            {activeSectionId === "data-collection" && spId && (
              <DataCollectionContent clientId={clientId} clientServicePlanId={spId} onNavigateToItem={handleNavigateToItem} />
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
