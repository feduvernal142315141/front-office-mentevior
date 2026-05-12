"use client"

import { useState } from "react"
import { ChevronDown, Settings } from "lucide-react"
import { Card } from "@/components/custom/Card"
import { cn } from "@/lib/utils"
import { useServicePlanConfig } from "@/lib/modules/service-plan-config/hooks/use-service-plan-config"
import { ServicePlanConfigForm } from "@/app/(app)/my-company/events/service-plan/components/ServicePlanConfigForm"

export function ServicePlanConfigurationSection() {
  const [expanded, setExpanded] = useState(true)
  const { config, isLoading } = useServicePlanConfig()

  return (
    <Card variant="elevated" padding="lg">
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings className="w-5 h-5 text-blue-700" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900">Configuration</h3>
            <p className="text-sm text-gray-500">Rules and constraints for service plan events</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded p-1"
          aria-label={expanded ? "Collapse service plan configuration" : "Expand service plan configuration"}
        >
          <ChevronDown
            className={cn("w-5 h-5 text-slate-400 transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
      </div>

      {expanded ? (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[52px] rounded-[16px] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <ServicePlanConfigForm
            config={config}
            onSavedRedirectPath="/my-company/service-plans"
            onCancelRedirectPath="/my-company/service-plans"
            showBottomBar={false}
            withContainerCard={false}
            hideHeader
          />
        )
      ) : null}
    </Card>
  )
}
