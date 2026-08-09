"use client"

import { useEffect, useState } from "react"
import { CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  MONTHS_SHORT,
  buildReportMonth,
  formatReportMonthLong,
  splitReportMonth,
} from "@/lib/utils/report-month"
import { cn } from "@/lib/utils"

interface MonthPickerProps {
  /** `yyyyMM`, o string vacío */
  value: string
  onChange: (reportMonth: string) => void
  label?: string
  hasError?: boolean
  disabled?: boolean
  required?: boolean
  /** Permite limpiar la selección — en los filtros sí, en el formulario no */
  clearable?: boolean
}

/**
 * Selector de **un** mes, en `yyyyMM`.
 *
 * Para reportes de un mes, no de un rango —por eso no se reusa el
 * `MonthRangePicker` de Clinical Monthly, que obliga a elegir dos extremos—.
 * Mismo lenguaje visual: altura de `FloatingSelect`, label flotante y grilla de
 * 12 meses con navegación por año.
 *
 * Lo usan Monthly Supervision y Case Supervision Log.
 */
export function MonthPicker({
  value,
  onChange,
  label = "Report month",
  hasError,
  disabled,
  required = true,
  clearable = false,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const parts = splitReportMonth(value)
  const [viewYear, setViewYear] = useState(() => parts?.year ?? new Date().getFullYear())

  // Al abrir, mostrar el año del mes ya elegido en vez del año en curso
  useEffect(() => {
    if (isOpen && parts) setViewYear(parts.year)
  }, [isOpen, parts?.year]) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerLabel = parts ? formatReportMonthLong(value) : ""

  return (
    <Popover open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "premium-input relative h-[52px] 2xl:h-[56px] w-full rounded-[16px] px-4 text-left",
            "flex items-center gap-2",
            hasError && "premium-input-error",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute px-1 transition-all duration-200 ease-out",
              "bg-white/20 backdrop-blur-md text-[var(--color-login-text-muted)]",
              triggerLabel || isOpen
                ? "left-4 top-0 -translate-y-1/2 text-xs"
                : "left-10 top-1/2 -translate-y-1/2 text-sm",
              isOpen && !disabled && "text-[#2563EB]",
            )}
          >
            {label} {required && <span className="text-[#037ECC]">*</span>}
          </span>

          <CalendarRange className="h-4 w-4 shrink-0 text-[#037ECC]" />
          <span className="flex-1 truncate text-[15px] text-slate-800">{triggerLabel}</span>

          {clearable && triggerLabel && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear month"
              onClick={(event) => {
                event.stopPropagation()
                onChange("")
              }}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* `bg-white` explícito: las variables de color del proyecto son canales
          HSL sueltos y `bg-popover` queda transparente con Tailwind v4. */}
      <PopoverContent
        align="start"
        className="z-[100] w-[300px] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setViewYear((year) => year - 1)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold tabular-nums text-slate-800">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((year) => year + 1)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 p-3">
          {MONTHS_SHORT.map((name, monthIndex) => {
            const isSelected = parts?.year === viewYear && parts?.monthIndex0 === monthIndex

            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(buildReportMonth(viewYear, monthIndex))
                  setIsOpen(false)
                }}
                className={cn(
                  "h-9 rounded-lg text-[13px] font-medium transition-all duration-150",
                  isSelected
                    ? "bg-[#037ECC] text-white shadow-sm shadow-[#037ECC]/30"
                    : "text-slate-600 hover:bg-[#037ECC]/10 hover:text-[#037ECC]",
                )}
              >
                {name}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
