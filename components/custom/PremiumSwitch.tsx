"use client"

import { cn } from "@/lib/utils"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import * as React from "react"

interface PremiumSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  variant?: "default" | "success" | "danger"
}

export function PremiumSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  variant = "default",
}: PremiumSwitchProps) {
  const variantColors = {
    default: {
      bg: checked ? "bg-blue-500" : "bg-gray-200",
      hover: checked ? "hover:bg-blue-600" : "hover:bg-gray-300",
      label: checked ? "text-blue-700" : "text-gray-700",
    },
    success: {
      bg: checked ? "bg-green-500" : "bg-gray-200",
      hover: checked ? "hover:bg-green-600" : "hover:bg-gray-300",
      label: checked ? "text-green-700" : "text-gray-700",
    },
    danger: {
      bg: checked ? "bg-red-500" : "bg-gray-200",
      hover: checked ? "hover:bg-red-600" : "hover:bg-gray-300",
      label: checked ? "text-red-700" : "text-gray-700",
    },
  }

  const colors = variantColors[variant]

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label
          className={cn(
            "text-sm font-medium transition-colors cursor-pointer",
            colors.label,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && onCheckedChange(!checked)}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      <SwitchPrimitives.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "disabled:cursor-not-allowed disabled:opacity-50",
          colors.bg,
          colors.hover,
          "shadow-sm"
        )}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
          )}
        />
      </SwitchPrimitives.Root>
    </div>
  )
}
