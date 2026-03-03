"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/custom/Button"

interface WizardFooterProps {
  isFirstStep: boolean
  isLastStep: boolean
  isSubmitting: boolean
  canContinue: boolean
  onBack: () => void
  onSave: () => void
  onSaveAndContinue: () => void
}

export function WizardFooter({
  isFirstStep,
  isLastStep,
  isSubmitting,
  canContinue,
  onBack,
  onSave,
  onSaveAndContinue,
}: WizardFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
      <div className="max-w-[1800px] mx-auto px-8 py-5 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={isSubmitting}
            className="h-12 px-8"
          >
            {isFirstStep ? "Cancel" : "Back"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onSave}
            disabled={!canContinue || isSubmitting}
            loading={isSubmitting}
            className="h-12 px-8"
          >
            Save
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onSaveAndContinue}
            disabled={!canContinue || isSubmitting}
            loading={isSubmitting}
            className="h-12 px-8 min-w-[180px]"
          >
            {isLastStep ? "Save & Finish" : "Save & Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}
