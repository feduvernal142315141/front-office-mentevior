"use client"

import { useCallback, useMemo, useState } from "react"
import {
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
} from "date-fns"

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

export type ChartRangePreset = "1W" | "2W" | "1M" | "3M" | "6M"

interface PresetConfig {
  label: string
  days: number
  /** How much to shift when navigating (prev/next) */
  shiftFn: (date: Date, dir: 1 | -1) => Date
}

const PRESET_MAP: Record<ChartRangePreset, PresetConfig> = {
  "1W": {
    label: "1W",
    days: 7,
    shiftFn: (d, dir) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)),
  },
  "2W": {
    label: "2W",
    days: 14,
    shiftFn: (d, dir) => (dir === 1 ? addWeeks(d, 2) : subWeeks(d, 2)),
  },
  "1M": {
    label: "1M",
    days: 30,
    shiftFn: (d, dir) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)),
  },
  "3M": {
    label: "3M",
    days: 90,
    shiftFn: (d, dir) => (dir === 1 ? addMonths(d, 3) : subMonths(d, 3)),
  },
  "6M": {
    label: "6M",
    days: 170,
    shiftFn: (d, dir) => (dir === 1 ? addMonths(d, 6) : subMonths(d, 6)),
  },
}

export const CHART_RANGE_PRESETS: ChartRangePreset[] = ["1W", "2W", "1M", "3M", "6M"]

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseChartDateRangeResult {
  /** Active preset key */
  preset: ChartRangePreset
  /** All days in the current range (array of Date) */
  chartDays: Date[]
  /** Formatted start date */
  startLabel: string
  /** Formatted end date */
  endLabel: string
  /** Full range label "MMM dd – MMM dd, yyyy" */
  rangeLabel: string
  /** Select a preset — resets end to today */
  setPreset: (preset: ChartRangePreset) => void
  /** Navigate backward */
  goToPrev: () => void
  /** Navigate forward */
  goToNext: () => void
  /** Jump so the range ends today */
  goToToday: () => void
  /** Whether the range currently ends on today */
  isAtToday: boolean
  /** Optimal tick interval for X axis labels (show every Nth label) */
  tickInterval: number
}

function buildRange(startDate: Date, preset: ChartRangePreset) {
  const cfg = PRESET_MAP[preset]
  const end = addDays(startDate, cfg.days - 1)
  return { start: startDate, end }
}

export function useChartDateRange(
  initialPreset: ChartRangePreset = "1W",
  anchorDate?: Date,
): UseChartDateRangeResult {
  const [preset, setPresetState] = useState<ChartRangePreset>(initialPreset)

  // The anchor is the first baseline date; default to today if none
  const resolvedAnchor = useMemo(() => {
    if (anchorDate) {
      const d = new Date(anchorDate)
      d.setHours(0, 0, 0, 0)
      return d
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }, [anchorDate])

  const [startDate, setStartDate] = useState<Date>(resolvedAnchor)

  // Sync startDate when anchor changes (item switch)
  const anchorKey = resolvedAnchor.getTime()
  const prevAnchorRef = useMemo(() => ({ current: anchorKey }), [])
  if (prevAnchorRef.current !== anchorKey) {
    prevAnchorRef.current = anchorKey
    setStartDate(resolvedAnchor)
  }

  const range = useMemo(() => buildRange(startDate, preset), [startDate, preset])

  const chartDays = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range]
  )

  const startLabel = useMemo(() => format(range.start, "MMM dd"), [range.start])
  const endLabel = useMemo(() => format(range.end, "MMM dd"), [range.end])
  const rangeLabel = useMemo(
    () => `${format(range.start, "MMM dd")} – ${format(range.end, "MMM dd, yyyy")}`,
    [range]
  )

  const isAtToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return isSameDay(startDate, resolvedAnchor)
  }, [startDate, resolvedAnchor])

  const setPreset = useCallback((p: ChartRangePreset) => {
    setPresetState(p)
    // Reset start to anchor when switching presets
    setStartDate(resolvedAnchor)
  }, [resolvedAnchor])

  const goToPrev = useCallback(() => {
    setStartDate((current) => {
      const cfg = PRESET_MAP[preset]
      return cfg.shiftFn(current, -1)
    })
  }, [preset])

  const goToNext = useCallback(() => {
    setStartDate((current) => {
      const cfg = PRESET_MAP[preset]
      return cfg.shiftFn(current, 1)
    })
  }, [preset])

  const goToToday = useCallback(() => {
    setStartDate(resolvedAnchor)
  }, [resolvedAnchor])

  // Always show every day label — font/rotation adapts in chart components
  const tickInterval = 0

  return {
    preset,
    chartDays,
    startLabel,
    endLabel,
    rangeLabel,
    setPreset,
    goToPrev,
    goToNext,
    goToToday,
    isAtToday,
    tickInterval,
  }
}
