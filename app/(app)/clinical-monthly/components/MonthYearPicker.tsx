"use client"

import { useEffect, useMemo, useState } from "react"
import { FloatingSelect } from "@/components/custom/FloatingSelect"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/** Años seleccionables: del actual hacia atrás, más el siguiente */
const YEAR_SPAN_BACK = 5

interface MonthYearPickerProps {
  label: string
  /** Formato `MM/yyyy`; string vacío cuando no hay selección */
  value: string
  onChange: (value: string) => void
  /** Año de referencia para armar la lista; se pasa explícito para no depender del reloj en render */
  currentYear: number
  hasError?: boolean
  disabled?: boolean
}

/**
 * Selector de mes/año. El contrato del backend usa `MM/yyyy`, no una fecha con
 * día, así que un date picker normal daría a entender una precisión que el
 * reporte no tiene.
 */
export function MonthYearPicker({
  label,
  value,
  onChange,
  currentYear,
  hasError,
  disabled,
}: MonthYearPickerProps) {
  // Mes y año viven acá adentro: `MM/yyyy` sólo existe cuando están los dos, y
  // si dependiéramos del valor del padre la primera selección no se vería
  // (FloatingSelect es controlado y pinta lo que le llega por `value`).
  const [selectedMonth, setSelectedMonth] = useState(() => splitValue(value).month)
  const [selectedYear, setSelectedYear] = useState(() => splitValue(value).year)

  // Sincroniza cuando el valor cambia desde afuera (p. ej. la precarga al editar)
  useEffect(() => {
    const { month, year } = splitValue(value)
    setSelectedMonth(month)
    setSelectedYear(year)
  }, [value])

  const monthOptions = useMemo(
    () => MONTHS.map((name, index) => ({
      value: String(index + 1).padStart(2, "0"),
      label: name,
    })),
    [],
  )

  const yearOptions = useMemo(() => {
    const years: { value: string; label: string }[] = []
    for (let year = currentYear + 1; year >= currentYear - YEAR_SPAN_BACK; year--) {
      years.push({ value: String(year), label: String(year) })
    }
    return years
  }, [currentYear])

  // El padre sólo recibe un `MM/yyyy` completo; a medias se le manda "" para que
  // la validación lo trate como sin elegir, pero la selección igual se ve.
  const emit = (month: string, year: string) => {
    onChange(month && year ? `${month}/${year}` : "")
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    emit(month, selectedYear)
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    emit(selectedMonth, year)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <FloatingSelect
        label={`${label} month`}
        value={selectedMonth}
        onChange={handleMonthChange}
        options={monthOptions}
        hasError={hasError}
        disabled={disabled}
      />
      <FloatingSelect
        label={`${label} year`}
        value={selectedYear}
        onChange={handleYearChange}
        options={yearOptions}
        hasError={hasError}
        disabled={disabled}
      />
    </div>
  )
}

/** `MM/yyyy` → partes; strings vacíos cuando no hay valor */
function splitValue(value: string): { month: string; year: string } {
  const [month = "", year = ""] = value ? value.split("/") : []
  return { month, year }
}
