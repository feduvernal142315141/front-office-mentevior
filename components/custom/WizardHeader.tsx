"use client"

import { cn } from "@/lib/utils"
import { UserSquare2 } from "lucide-react"

interface WizardHeaderProps {
  clientName?: string
  currentStep: number
  totalSteps: number
  completionPercentage: number
  profileStatus: "incomplete" | "complete" | "ready"
}

export function WizardHeader({
  clientName = "New Client",
  currentStep,
  totalSteps,
  completionPercentage,
  profileStatus,
}: WizardHeaderProps) {
  const statusConfig = {
    incomplete: {
      label: "Profile Incomplete",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    complete: {
      label: "Profile Complete",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    ready: {
      label: "Ready for Billing",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
  }

  const status = statusConfig[profileStatus]

  return (
    <div className="bg-white border-b border-slate-200/60 px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <UserSquare2 className="h-7 w-7 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              {clientName}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete all sections to enable clinical operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold border transition-all",
              status.className
            )}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-bold text-[#037ECC]">
            {completionPercentage}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#037ECC] to-[#079CFB] transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(3,126,204,0.4)]"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}
