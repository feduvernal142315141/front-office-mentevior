"use client"

import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon } from "lucide-react"

interface PremiumDatePickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  label: string
  hasError?: boolean
  errorMessage?: string
  description?: string
}

export function PremiumDatePicker({
  value,
  onChange,
  onBlur,
  label,
  hasError,
  errorMessage,
  description,
}: PremiumDatePickerProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            /* Size */
            "w-full",
            "h-[52px] 2xl:h-[56px]",
            "px-4 pr-12",
            
            /* Shape */
            "rounded-[16px]",
            
            /* Text */
            "text-[15px] 2xl:text-[16px]",
            "text-[var(--color-login-text-primary)]",
            
            /* Background gradient */
            "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
            
            /* Border */
            hasError 
              ? "border-2 border-red-500/70"
              : "border border-[hsl(240_20%_88%/0.6)]",
            
            /* Shadow */
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
            
            /* Hover */
            "hover:border-[hsl(240_35%_75%/0.6)]",
            "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_6px_rgba(15,23,42,0.06)]",
            
            /* Focus */
            "focus:outline-none",
            "focus:border-[hsl(var(--primary))]",
            "focus:bg-gradient-to-b focus:from-white focus:to-[hsl(240_20%_99%)]",
            "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12),0_6px_14px_hsl(var(--primary)/0.18)]",
            "focus:-translate-y-[1px]",
            
            /* Transitions */
            "transition-all duration-200 ease-out",
            
            /* Date picker icon color */
            "[color-scheme:light]"
          )}
        />
        
        <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      
      {description && !hasError && (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      )}
      
      {hasError && errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
