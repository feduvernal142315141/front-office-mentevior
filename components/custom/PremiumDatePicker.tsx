"use client"

import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon } from "lucide-react"
import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

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
  const [isFocused, setIsFocused] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Convert string value to Date object in LOCAL timezone
  // Usar parseLocalDate para evitar problemas de zona horaria
  const parseLocalDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined
    
    // Split YYYY-MM-DD y crear fecha en zona local
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!year || !month || !day) return undefined
    
    // Mes es 0-indexed en JavaScript
    return new Date(year, month - 1, day)
  }
  
  const dateValue = parseLocalDate(value)
  const hasValue = value && value.length > 0

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert Date to YYYY-MM-DD format usando zona local
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    }
    setIsOpen(false)
  }

  return (
    <div className="w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <button
              type="button"
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false)
                onBlur?.()
              }}
              className={cn(
                /* Layout */
                "flex items-center",
                
                /* Size */
                "w-full",
                "h-[52px] 2xl:h-[56px]",
                "px-4 pr-12",
                
                /* Shape */
                "rounded-[16px]",
                
                /* Text */
                "text-left",
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
                "transition-all duration-200 ease-out"
              )}
            >
              {hasValue && dateValue ? format(dateValue, "dd/MM/yyyy") : ""}
            </button>
            
            {/* Floating Label */}
            <label
              className={cn(
                "absolute left-4 px-1 pointer-events-none",
                "transition-all duration-200 ease-out",
                "bg-white/20 backdrop-blur-md",
                
                /* Label position - siempre arriba cuando hay valor o focus */
                isFocused || hasValue || isOpen
                  ? "top-0 -translate-y-1/2 text-xs"
                  : "top-1/2 -translate-y-1/2 text-sm",
                
                /* Label color - azul solo cuando focused */
                isFocused || isOpen
                  ? "text-[#2563EB]"
                  : "text-[var(--color-login-text-muted)]"
              )}
            >
              {label} <span className="text-[#2563EB]">*</span>
            </label>
            
            <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-auto p-0 bg-white/95 backdrop-blur-xl border-gray-200 shadow-2xl rounded-[16px]" 
          align="start"
          sideOffset={8}
        >
          <div className="p-3 bg-gradient-to-br from-white to-gray-50/50 rounded-[16px]">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleSelect}
              initialFocus
              className="rounded-xl"
            />
          </div>
        </PopoverContent>
      </Popover>
      
      {description && !hasError && (
        <p className="mt-1.5 text-xs text-gray-500">{description}</p>
      )}
      
      {hasError && errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
