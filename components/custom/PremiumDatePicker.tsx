"use client"

import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
  const currentYear = new Date().getFullYear()
  const fromYear = currentYear - 100
  const toYear = currentYear + 10
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())
  const [monthOpen, setMonthOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)
  
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
  
  const dateValue = useMemo(() => parseLocalDate(value), [value])
  const hasValue = value && value.length > 0

  useEffect(() => {
    if (!dateValue) return
    setDisplayMonth(dateValue)
  }, [value])

  useEffect(() => {
    if (!isOpen) {
      setMonthOpen(false)
      setYearOpen(false)
    }
  }, [isOpen])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert Date to YYYY-MM-DD format usando zona local
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    }
    setMonthOpen(false)
    setYearOpen(false)
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
          className="p-0 w-[calc(100vw-24px)] sm:w-[370px] sm:max-w-[370px] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.12)] rounded-[16px]" 
          align="end"
          sideOffset={8}
        >
          <div className="p-5 bg-gradient-to-br from-white to-gray-50/60 rounded-[16px]">
            <div className="flex items-center justify-between gap-2 px-1 pb-3">
              <button
                type="button"
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC] transition-colors"
              >
                <span className="sr-only">Previous month</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMonthOpen((prev) => !prev)}
                    className="h-8 px-2.5 pr-6 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-900 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]/40 relative"
                  >
                    {format(new Date(2020, displayMonth.getMonth(), 1), "MMM")}
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  </button>
                  {monthOpen && (
                    <div className="absolute left-0 mt-2 z-[60] min-w-[120px] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                      {Array.from({ length: 12 }).map((_, index) => {
                        const isSelected = index === displayMonth.getMonth()
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setDisplayMonth(new Date(displayMonth.getFullYear(), index, 1))
                              setMonthOpen(false)
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-xs text-left cursor-pointer transition-colors",
                              isSelected
                                ? "bg-[#037ECC] text-white"
                                : "text-slate-700 hover:bg-[#037ECC]/10"
                            )}
                          >
                            {format(new Date(2020, index, 1), "MMMM")}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setYearOpen((prev) => !prev)}
                    className="h-8 px-2.5 pr-6 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]/40 relative"
                  >
                    {displayMonth.getFullYear()}
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  </button>
                  {yearOpen && (
                    <div className="absolute right-0 mt-2 z-[60] min-w-[90px] max-h-[200px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {Array.from({ length: toYear - fromYear + 1 }).map((_, idx) => {
                        const year = fromYear + idx
                        const isSelected = year === displayMonth.getFullYear()
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => {
                              setDisplayMonth(new Date(year, displayMonth.getMonth(), 1))
                              setYearOpen(false)
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-xs text-left cursor-pointer transition-colors",
                              isSelected
                                ? "bg-[#037ECC] text-white"
                                : "text-slate-700 hover:bg-[#037ECC]/10"
                            )}
                          >
                            {year}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-[#037ECC]/5 hover:border-[#037ECC]/30 hover:text-[#037ECC] transition-colors"
              >
                <span className="sr-only">Next month</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleSelect}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              captionLayout="label"
              formatters={{
                formatWeekdayName: (date) =>
                  date
                    .toLocaleDateString("en-US", { weekday: "short" })
                    .toUpperCase()
                    .slice(0, 2),
              }}
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full px-1.5 pb-1",
                table: "w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5",
                weekdays: "flex mb-3 px-1.5",
                weekday: "text-[11px] font-semibold text-slate-500 tracking-[0.18em]",
                week: "flex w-full gap-1.5",
                day: "p-0",
                day_button:
                  "h-9 w-9 rounded-full text-sm font-medium text-slate-700 transition-colors hover:bg-[#037ECC]/10 hover:text-slate-900 data-[selected-single=true]:bg-[#037ECC] data-[selected-single=true]:text-white",
                today:
                  "text-[#037ECC] data-[selected-single=true]:text-white",
                month_caption: "hidden",
                nav: "hidden",
              }}
              initialFocus
              className="rounded-xl w-full [--cell-size:36px]"
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
