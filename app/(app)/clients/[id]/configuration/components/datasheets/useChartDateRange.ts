"use client"

import { useCallback, useMemo, useState } from "react"
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subWeeks,
  subMonths,
  subYears,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
  isSameDay,
} from "date-fns"
import { ChartInterval } from "@/lib/modules/service-plans/constants/chart.constants"

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

export type ChartRangePreset = "1W" | "2W" | "1M" | "3M" | "6M"

interface PresetConfig {
  label: string
  days: number
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

/** Minimum preset per interval to make visual sense */
const MIN_PRESET_FOR_INTERVAL: Record<string, ChartRangePreset | null> = {
  [ChartInterval.DAILY]: null,
  [ChartInterval.WEEKLY]: "1M",
  [ChartInterval.MONTHLY]: null, // monthly uses full-year range, presets disabled
}

export const CHART_RANGE_PRESETS: ChartRangePreset[] = ["1W", "2W", "1M", "3M", "6M"]

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseChartDateRangeResult {
  preset: ChartRangePreset
  chartDays: Date[]
  startLabel: string
  endLabel: string
  rangeLabel: string
  setPreset: (preset: ChartRangePreset) => void
  goToPrev: () => void
  goToNext: () => void
  goToToday: () => void
  isAtToday: boolean
  tickInterval: number
  interval: ChartInterval
  setInterval: (interval: ChartInterval) => void
  /** Whether range presets are disabled (e.g., Monthly uses full year) */
  presetsDisabled: boolean
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
  const [interval, setIntervalState] = useState<ChartInterval>(ChartInterval.DAILY)

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

  // Monthly interval → full year range (Jan 1 - Dec 31)
  const isMonthlyFullYear = interval === ChartInterval.MONTHLY
  const presetsDisabled = isMonthlyFullYear

  const range = useMemo(() => {
    if (isMonthlyFullYear) {
      return {
        start: startOfYear(startDate),
        end: endOfYear(startDate),
      }
    }
    return buildRange(startDate, preset)
  }, [startDate, preset, isMonthlyFullYear])

  const chartDays = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range]
  )

  const startLabel = useMemo(() => format(range.start, "MMM dd"), [range.start])
  const endLabel = useMemo(() => format(range.end, "MMM dd"), [range.end])
  const rangeLabel = useMemo(() => {
    if (isMonthlyFullYear) {
      return format(range.start, "yyyy")
    }
    return `${format(range.start, "MMM dd")} – ${format(range.end, "MMM dd, yyyy")}`
  }, [range, isMonthlyFullYear])

  const isAtToday = useMemo(() => {
    return isSameDay(startDate, resolvedAnchor)
  }, [startDate, resolvedAnchor])

  const setPreset = useCallback((p: ChartRangePreset) => {
    if (presetsDisabled) return
    setPresetState(p)
    setStartDate(resolvedAnchor)
    // 1W or 2W → auto-select Daily (weekly aggregation doesn't make sense for 1-2 weeks)
    if ((p === "1W" || p === "2W") && interval !== ChartInterval.DAILY) {
      setIntervalState(ChartInterval.DAILY)
    }
  }, [resolvedAnchor, presetsDisabled, interval])

  const goToPrev = useCallback(() => {
    if (isMonthlyFullYear) {
      setStartDate((current) => subYears(current, 1))
    } else {
      setStartDate((current) => {
        const cfg = PRESET_MAP[preset]
        return cfg.shiftFn(current, -1)
      })
    }
  }, [preset, isMonthlyFullYear])

  const goToNext = useCallback(() => {
    if (isMonthlyFullYear) {
      setStartDate((current) => addYears(current, 1))
    } else {
      setStartDate((current) => {
        const cfg = PRESET_MAP[preset]
        return cfg.shiftFn(current, 1)
      })
    }
  }, [preset, isMonthlyFullYear])

  const goToToday = useCallback(() => {
    setStartDate(resolvedAnchor)
  }, [resolvedAnchor])

  const tickInterval = 0

  const setInterval = useCallback((i: ChartInterval) => {
    setIntervalState(i)
    // Auto-adjust preset when switching intervals
    const minPreset = MIN_PRESET_FOR_INTERVAL[i]
    if (minPreset) {
      const presetOrder: ChartRangePreset[] = ["1W", "2W", "1M", "3M", "6M"]
      const currentIdx = presetOrder.indexOf(preset)
      const minIdx = presetOrder.indexOf(minPreset)
      if (currentIdx < minIdx) {
        setPresetState(minPreset)
        setStartDate(resolvedAnchor)
      }
    }
  }, [preset, resolvedAnchor])

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
    interval,
    setInterval,
    presetsDisabled,
  }
}
