"use client"

import { FileText } from "lucide-react"

import { Card } from "@/components/custom/Card"
import { Badge } from "@/components/ui/badge"
import type { CompanyServicePlan } from "@/lib/types/company-service-plan.types"

interface ServicePlanSummaryCardProps {
  servicePlan: CompanyServicePlan
  serviceLabel: string
}

export function ServicePlanSummaryCard({ servicePlan, serviceLabel }: ServicePlanSummaryCardProps) {
  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-slate-500" />
          <h2 className="truncate text-lg font-semibold text-slate-900">{servicePlan.name}</h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {serviceLabel !== "-" && <span className="text-sm text-slate-500">{serviceLabel}</span>}
          <Badge
            variant="outline"
            className={
              servicePlan.active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }
          >
            {servicePlan.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
