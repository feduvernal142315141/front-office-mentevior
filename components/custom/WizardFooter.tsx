"use client"

import { Button } from "@/components/custom/Button"

interface WizardFooterProps {
  isLastStep: boolean
  isSubmitting: boolean
  canContinue: boolean
  isPersonalInfoStep: boolean
  primaryActionLabel?: string
  onCancel: () => void
  onSave: () => void
  onSaveAndContinue: () => void
  onClose: () => void
}

export function WizardFooter({
  isLastStep,
  isSubmitting,
  canContinue,
  isPersonalInfoStep,
  primaryActionLabel,
  onCancel,
  onSave,
  onSaveAndContinue,
  onClose,
}: WizardFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
      <div className="max-w-[1800px] mx-auto px-8 py-5 flex items-center justify-end">
        <div className="flex items-center gap-3">
          {primaryActionLabel ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-12 px-8"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onSave}
                loading={isSubmitting}
                disabled={isSubmitting}
                className="h-12 px-8 min-w-[180px]"
              >
                {primaryActionLabel}
              </Button>
            </>
          ) : isPersonalInfoStep ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-12 px-8"
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={onSaveAndContinue}
                disabled={!canContinue || isSubmitting}
                loading={isSubmitting}
                className="h-12 px-8 min-w-[180px]"
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-12 px-8"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
