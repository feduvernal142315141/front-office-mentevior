"use client"

import { CustomModal } from "./CustomModal"
import { Button } from "./Button"
import { AlertTriangle, Info } from "lucide-react"

interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: "danger" | "warning" | "info"
  isLoading?: boolean
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "info",
  isLoading = false,
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  const iconColors = {
    danger: "text-red-600 bg-red-100",
    warning: "text-amber-600 bg-amber-100",
    info: "text-blue-600 bg-blue-100",
  }

  const buttonVariants = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 text-white",
    info: "bg-blue-600 hover:bg-blue-700 text-white",
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title=""
      maxWidthClassName="sm:max-w-[420px]"
    >
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${iconColors[variant]}`}>
            {variant === "danger" || variant === "warning" ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Info className="h-6 w-6" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6">{description}</p>

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              loading={isLoading}
              disabled={isLoading}
              className={`flex-1 ${buttonVariants[variant]}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </CustomModal>
  )
}
