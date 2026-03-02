"use client"

import { cn } from "@/lib/utils"
import { Check, AlertCircle, Clock } from "lucide-react"
import type { StepConfig } from "@/lib/types/wizard.types"

interface WizardStepperProps {
  steps: StepConfig[]
  activeStepIndex: number
  onStepClick: (index: number) => void
}

export function WizardStepper({ steps, activeStepIndex, onStepClick }: WizardStepperProps) {
  return (
    <div className="w-80 bg-white border-r border-slate-200/60 p-6 custom-scrollbar overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
          Profile Setup
        </h2>
        <p className="text-sm text-slate-500 mt-1">Complete all required sections</p>
      </div>

      <div className="space-y-2 pb-8">
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex
          const isCompleted = step.status === "COMPLETE"
          const hasError = step.status === "ERROR"

          return (
            <div key={step.id} className="relative">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className={cn(
                  "relative w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300",
                  "group",
                  isActive && "bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 border border-[#037ECC]/20 shadow-sm",
                  isCompleted && !isActive && "bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 border border-[#037ECC]/10",
                  !isActive && !isCompleted && "hover:bg-slate-50/80"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    "border-2",
                    isActive && "border-[#037ECC] bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10",
                    isCompleted && !isActive && "border-[#037ECC] bg-gradient-to-br from-[#037ECC] to-[#079CFB]",
                    hasError && "border-red-500 bg-red-50",
                    !isActive && !isCompleted && !hasError && "border-slate-300 bg-white"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : hasError ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : isActive ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#037ECC] animate-pulse" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <h3
                    className={cn(
                      "text-sm font-semibold transition-colors truncate",
                      isActive && "text-[#037ECC]",
                      isCompleted && !isActive && "text-[#037ECC]/90",
                      !isActive && !isCompleted && "text-slate-700"
                    )}
                  >
                    {step.title}
                  </h3>
                  {hasError && step.requiredFieldsMissing && step.requiredFieldsMissing > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {step.requiredFieldsMissing} required {step.requiredFieldsMissing === 1 ? "field" : "fields"} missing
                    </p>
                  )}
                </div>

                {isActive && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#037ECC] to-[#079CFB] rounded-full" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
