"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MAX_MONTH_RANGE } from "@/lib/modules/clinical-monthly/utils/month-range"
import { cn } from "@/lib/utils"

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

interface MonthRangePickerProps {
  /** `MM/yyyy`, o string vacío */
  startValue: string
  /** `MM/yyyy`, o string vacío */
  endValue: string
  /** Emite ambos extremos a la vez; strings vacíos cuando se limpia */
  onChange: (startMonthYear: string, endMonthYear: string) => void
  /** Año de referencia; se pasa explícito para no depender del reloj en render */
  currentYear: number
  label?: string
  hasError?: boolean
  disabled?: boolean
}

/**
 * Selección del período del reporte en un solo calendario: se elige mes de
 * inicio y mes de fin con dos clics, con el rango resaltado.
 *
 * El grano es **mes**, no día, porque el contrato del backend es `MM/yyyy`
 * (`startMonthYear` / `endMonthYear`). Un date picker de día sugeriría una
 * precisión que el reporte no tiene.
 *
 * Los meses que excederían el tope de 12 quedan deshabilitados mientras se
 * elige el fin, así el rango inválido no se puede ni construir.
 */
export function MonthRangePicker({
  startValue,
  endValue,
  onChange,
  currentYear,
  label = "Reporting period",
  hasError,
  disabled,
}: MonthRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewYear, setViewYear] = useState(currentYear)
  /** Índice del inicio mientras falta elegir el fin; null cuando el rango está completo */
  const [pendingStart, setPendingStart] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const startIndex = toMonthIndex(startValue)
  const endIndex = toMonthIndex(endValue)

  // Al abrir, mostrar el año del rango ya elegido en vez del año actual
  useEffect(() => {
    if (!isOpen) return
    setPendingStart(null)
    setHoveredIndex(null)
    if (startIndex != null) setViewYear(Math.floor(startIndex / 12))
    else setViewYear(currentYear)
  }, [isOpen, startIndex, currentYear])

  const triggerLabel = useMemo(() => {
    if (startIndex == null || endIndex == null) return ""
    return `${formatLong(startIndex)} – ${formatLong(endIndex)}`
  }, [startIndex, endIndex])

  const monthCount = useMemo(() => {
    if (startIndex == null || endIndex == null) return 0
    return endIndex - startIndex + 1
  }, [startIndex, endIndex])

  // Rango que se pinta: el confirmado, o la preview mientras se elige el fin
  const [highlightFrom, highlightTo] =
    pendingStart != null
      ? [pendingStart, hoveredIndex != null && hoveredIndex >= pendingStart ? hoveredIndex : pendingStart]
      : [startIndex ?? -1, endIndex ?? -1]

  const handleSelect = (index: number) => {
    // Sin inicio pendiente (o con un rango ya completo) se arranca uno nuevo
    if (pendingStart == null) {
      setPendingStart(index)
      return
    }
    // Un mes anterior al inicio reinicia la selección en vez de dar error
    if (index < pendingStart) {
      setPendingStart(index)
      return
    }
    onChange(fromMonthIndex(pendingStart), fromMonthIndex(index))
    setPendingStart(null)
    setIsOpen(false)
  }

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    onChange("", "")
    setPendingStart(null)
  }

  /** Con inicio elegido, sólo se habilitan los 12 meses del tope */
  const isDisabledMonth = (index: number) => {
    if (pendingStart == null) return false
    return index > pendingStart + (MAX_MONTH_RANGE - 1)
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            // Misma altura que FloatingSelect para que la grilla quede alineada
            "premium-input relative h-[52px] 2xl:h-[56px] w-full rounded-[16px] px-4 text-left",
            "flex items-center gap-2",
            hasError && "premium-input-error",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {/* Mismo comportamiento que FloatingSelect: sube al borde con valor o
              al abrir. En reposo va después del icono para no encimarse con él. */}
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
            {label} <span className="text-[#037ECC]">*</span>
          </span>

          <CalendarRange className="h-4 w-4 shrink-0 text-[#037ECC]" />
          <span className="flex-1 truncate text-[15px] text-slate-800">{triggerLabel}</span>

          {triggerLabel && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear period"
              onClick={handleClear}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* `bg-popover` no funciona en este proyecto: las variables de color son
          canales HSL sueltos y Tailwind v4 no las resuelve, así que el fondo
          queda transparente. El resto de popovers también pasa `bg-white`. */}
      <PopoverContent
        align="start"
        className="z-[100] w-[320px] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"
      >
        {/* Año */}
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold tabular-nums text-slate-800">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Meses */}
        <div className="grid grid-cols-3 gap-1 p-3" onMouseLeave={() => setHoveredIndex(null)}>
          {MONTHS_SHORT.map((name, month) => {
            const index = viewYear * 12 + month
            const isStart = index === highlightFrom
            const isEnd = index === highlightTo
            const inRange = highlightFrom >= 0 && index > highlightFrom && index < highlightTo
            const isEdge = (isStart || isEnd) && highlightFrom >= 0
            const monthDisabled = isDisabledMonth(index)

            return (
              <button
                key={name}
                type="button"
                disabled={monthDisabled}
                onMouseEnter={() => setHoveredIndex(index)}
                onClick={() => handleSelect(index)}
                className={cn(
                  "h-9 rounded-lg text-[13px] font-medium transition-all duration-150",
                  monthDisabled && "cursor-not-allowed text-slate-300",
                  !monthDisabled && !isEdge && !inRange && "text-slate-600 hover:bg-[#037ECC]/10 hover:text-[#037ECC]",
                  inRange && "bg-[#037ECC]/10 text-[#037ECC]",
                  isEdge && "bg-[#037ECC] text-white shadow-sm shadow-[#037ECC]/30",
                )}
              >
                {name}
              </button>
            )
          })}
        </div>

        {/* Pie con el estado de la selección */}
        <div className="border-t border-slate-100 px-3 py-2.5 text-[11px] text-slate-500">
          {pendingStart != null ? (
            <span>
              Start: <strong className="text-slate-700">{formatLong(pendingStart)}</strong> — now pick the
              end month (up to {MAX_MONTH_RANGE})
            </span>
          ) : monthCount > 0 ? (
            <span>
              <strong className="text-slate-700">{monthCount}</strong> {monthCount === 1 ? "month" : "months"} selected
            </span>
          ) : (
            <span>Pick the start month, then the end month</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** `MM/yyyy` → índice comparable de meses; null si el formato no sirve */
function toMonthIndex(monthYear: string): number | null {
  if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(monthYear.trim())) return null
  const [month, year] = monthYear.trim().split("/").map(Number)
  return year * 12 + (month - 1)
}

/** índice → `MM/yyyy` */
function fromMonthIndex(index: number): string {
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  return `${String(month).padStart(2, "0")}/${year}`
}

/** índice → "May 2026" */
function formatLong(index: number): string {
  return `${MONTHS_LONG[index % 12]} ${Math.floor(index / 12)}`
}
