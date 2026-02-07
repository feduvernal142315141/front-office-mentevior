"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface CollapsableCardProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  badge?: string | number
  disabled?: boolean
  onToggle?: (isOpen: boolean) => void
}

export function CollapsableCard({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
  className,
  badge,
  disabled = false,
  onToggle,
}: CollapsableCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    if (disabled) return
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div
      className={cn(
        "group rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300",
        isOpen && "shadow-md",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full px-6 py-4 flex items-center justify-between transition-colors duration-200",
          !disabled && "hover:bg-gray-50/50 cursor-pointer",
          disabled && "cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {icon && (
            <div
              className={cn(
                "flex-shrink-0 p-2.5 rounded-lg transition-all duration-300",
                isOpen
                  ? "bg-gradient-to-br from-[#037ECC] to-[#079CFB] shadow-md shadow-[#037ECC]/20"
                  : "bg-gray-100 group-hover:bg-gray-200"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isOpen ? "text-white" : "text-gray-600"
                )}
              >
                {icon}
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-3">
              <h3
                className={cn(
                  "text-base font-semibold transition-colors duration-200",
                  isOpen ? "text-[#037ECC]" : "text-gray-900"
                )}
              >
                {title}
              </h3>
              {badge !== undefined && (
                <span
                  className={cn(
                    "flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-bold transition-colors duration-200",
                    isOpen
                      ? "bg-[#037ECC]/10 text-[#037ECC]"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          <div
            className={cn(
              "p-1.5 rounded-lg transition-all duration-300",
              isOpen
                ? "bg-[#037ECC]/10 rotate-180"
                : "bg-gray-100 group-hover:bg-gray-200"
            )}
          >
            <ChevronDown
              className={cn(
                "w-5 h-5 transition-all duration-300",
                isOpen ? "text-[#037ECC]" : "text-gray-600"
              )}
            />
          </div>
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 pb-6 pt-2">
          <div className="border-t border-gray-200 pt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
