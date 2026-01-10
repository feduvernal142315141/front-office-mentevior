/**
 * FORM BOTTOM BAR
 * 
 * Reusable fixed bottom bar for forms with Cancel and Submit buttons.
 * Provides consistent UX across all forms in the application.
 */

"use client"

import { Button } from "@/components/custom/Button"
import { X, Save } from "lucide-react"

interface FormBottomBarProps {
  /**
   * Whether form is submitting
   */
  isSubmitting: boolean
  
  /**
   * Cancel button click handler
   */
  onCancel: () => void
  
  /**
   * Submit button text
   * @example "Create User" | "Update Address" | "Save Changes"
   */
  submitText: string
  
  /**
   * Optional cancel button text
   * @default "Cancel"
   */
  cancelText?: string
  
  /**
   * Optional submit button icon (overrides default Save icon)
   */
  submitIcon?: React.ReactNode
  
  /**
   * Optional cancel button icon (overrides default X icon)
   */
  cancelIcon?: React.ReactNode
  
  /**
   * Whether to disable submit button independently of isSubmitting
   */
  disabled?: boolean
}

export function FormBottomBar({
  isSubmitting,
  onCancel,
  submitText,
  cancelText = "Cancel",
  submitIcon,
  cancelIcon,
  disabled = false,
}: FormBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="gap-2 flex items-center"
          >
            {cancelIcon || <X className="w-4 h-4" />}
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || disabled}
            loading={isSubmitting}
            className="gap-2 flex items-center min-w-[160px]"
          >
            {!isSubmitting && (submitIcon || <Save className="w-4 h-4" />)}
            {submitText}
          </Button>
        </div>
      </div>
    </div>
  )
}
