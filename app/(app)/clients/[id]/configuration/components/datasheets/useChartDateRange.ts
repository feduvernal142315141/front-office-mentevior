"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
  addWeeks,
  addMonths,
  addYears,
  subWeeks,
  subMonths,
  subYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
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
  shiftFn: (date: Date, dir: 1 | -1) => Date
}

const PRESET_MAP: Record<ChartRangePreset, PresetConfig> = {
  "1W": {
    label: "1W",
    shiftFn: (d, dir) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)),
  },
  "2W": {
    label: "2W",
    shiftFn: (d, dir) => (dir === 1 ? addWeeks(d, 2) : subWeeks(d, 2)),
  },
  "1M": {
    label: "1M",
    shiftFn: (d, dir) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)),
  },
  "3M": {
    label: "3M",
    shiftFn: (d, dir) => (dir === 1 ? addMonths(d, 3) : subMonths(d, 3)),
  },
  "6M": {
    label: "6M",
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

function startOfDayCopy(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

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

const WEEK_OPTS = { weekStartsOn: 0 as const } // Sunday

/**
 * Presets are CALENDAR windows around `anchor` (today, or the session date), not trailing
 * N-day windows: "1W" is the Sunday→Saturday week containing the anchor, "2W" adds the
 * previous calendar week, and the month presets cover whole calendar months. The anchor's
 * remaining week/month days sit on the right, so today reads inside its familiar frame.
 */
function buildRange(anchor: Date, preset: ChartRangePreset) {
  switch (preset) {
    case "1W":
      return { start: startOfWeek(anchor, WEEK_OPTS), end: endOfWeek(anchor, WEEK_OPTS) }
    case "2W":
      return { start: startOfWeek(subWeeks(anchor, 1), WEEK_OPTS), end: endOfWeek(anchor, WEEK_OPTS) }
    case "1M":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
    case "3M":
      return { start: startOfMonth(subMonths(anchor, 2)), end: endOfMonth(anchor) }
    case "6M":
      return { start: startOfMonth(subMonths(anchor, 5)), end: endOfMonth(anchor) }
  }
}

export function useChartDateRange(
  initialPreset: ChartRangePreset = "1W",
  /** Anchor of the calendar window. Defaults to today; the session note pins it to the session date. */
  endAnchorDate?: Date,
): UseChartDateRangeResult {
  const endAnchor = useMemo(
    () => startOfDayCopy(endAnchorDate ?? new Date()),
    [endAnchorDate],
  )

  const [preset, setPresetState] = useState<ChartRangePreset>(initialPreset)
  const [interval, setIntervalState] = useState<ChartInterval>(ChartInterval.DAILY)

  const [anchor, setAnchor] = useState<Date>(endAnchor)

  // Re-anchor the window when the item (or its session date) changes
  const syncKey = endAnchor.getTime()
  const prevSyncRef = useRef(syncKey)
  if (prevSyncRef.current !== syncKey) {
    prevSyncRef.current = syncKey
    setAnchor(endAnchor)
    setPresetState(initialPreset)
  }

  // Monthly interval → full year range (Jan 1 - Dec 31)
  const isMonthlyFullYear = interval === ChartInterval.MONTHLY
  const presetsDisabled = isMonthlyFullYear

  // Baselines older than the window are NOT part of the range: they are drawn anyway, as a
  // pinned prefix, by the chart itself (see FrequencyChart / useChartData).
  const range = useMemo(() => {
    return isMonthlyFullYear
      ? { start: startOfYear(anchor), end: endOfYear(anchor) }
      : buildRange(anchor, preset)
  }, [anchor, preset, isMonthlyFullYear])

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
    return isSameDay(anchor, endAnchor)
  }, [anchor, endAnchor])

  const setPreset = useCallback((p: ChartRangePreset) => {
    if (presetsDisabled) return
    setPresetState(p)
    setAnchor(endAnchor)
    // 1W or 2W → auto-select Daily (weekly aggregation doesn't make sense for 1-2 weeks)
    if ((p === "1W" || p === "2W") && interval !== ChartInterval.DAILY) {
      setIntervalState(ChartInterval.DAILY)
    }
  }, [endAnchor, presetsDisabled, interval])

  const goToPrev = useCallback(() => {
    setAnchor((current) =>
      isMonthlyFullYear ? subYears(current, 1) : PRESET_MAP[preset].shiftFn(current, -1),
    )
  }, [preset, isMonthlyFullYear])

  const goToNext = useCallback(() => {
    setAnchor((current) => {
      const next = isMonthlyFullYear ? addYears(current, 1) : PRESET_MAP[preset].shiftFn(current, 1)
      // Never scroll past the anchor — there is no data ahead of it
      return next.getTime() > endAnchor.getTime() ? endAnchor : next
    })
  }, [preset, isMonthlyFullYear, endAnchor])

  const goToToday = useCallback(() => {
    setAnchor(endAnchor)
  }, [endAnchor])

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
        setAnchor(endAnchor)
      }
    }
  }, [preset, endAnchor])

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
