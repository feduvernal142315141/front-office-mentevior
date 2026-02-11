"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface CollapsableSectionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onToggle?: (isOpen: boolean) => void
}

export function CollapsableSection({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
  className,
  disabled = false,
  onToggle,
}: CollapsableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    if (disabled) return
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full group flex items-center justify-between py-4 transition-colors duration-200",
          !disabled && "hover:opacity-80 cursor-pointer",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
              {icon}
            </div>
          )}

          <div className="flex-1 min-w-0 text-left">
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 transition-all duration-300 flex-shrink-0 ml-4",
            isOpen && "rotate-180 text-[#037ECC]"
          )}
        />
      </button>

      <div className="border-t border-gray-200" />

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[5000px] opacity-100 overflow-visible" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="pt-6 pb-8">{children}</div>
      </div>
    </div>
  )
}
