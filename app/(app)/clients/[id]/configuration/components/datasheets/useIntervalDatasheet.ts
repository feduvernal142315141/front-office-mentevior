import { useCallback, useMemo, useRef, useState } from "react"
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isToday as isTodayFn } from "date-fns"
import type { ClientServicePlanItemBaseline } from "@/lib/types/client-service-plan.types"
import {
  type IntervalDayEntry,
  type IntervalWeekEntries,
  type IntervalValue,
  createEmptyIntervalDayEntry,
  calculateIntervalPercentage,
  countPositive,
  cycleIntervalValue,
} from "./interval-datasheet.types"
import { getDateKey, parseLocalDate } from "./datasheet-utils"

export type RangeMode = "week" | "month" | "custom"

export function useIntervalDatasheet(
  numberOfIntervals: number,
  baselines?: ClientServicePlanItemBaseline[],
) {
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [rangeMode, setRangeMode] = useState<RangeMode>("week")
  const [entries, setEntries] = useState<IntervalWeekEntries>({})

  // Snapshot tracking for dirty detection
  const [originalDcEntries, setOriginalDcEntries] = useState<IntervalWeekEntries>({})

  // Baseline date set
  const baselineDateKeys = useMemo(() => {
    if (!baselines || baselines.length === 0) return new Set<string>()
    return new Set(
      baselines.filter((b) => b.date).map((b) => getDateKey(parseLocalDate(b.date)))
    )
  }, [baselines])

  // Original baseline entries for dirty detection
  const [originalBaselineEntries, setOriginalBaselineEntries] = useState<IntervalWeekEntries>({})

  // Seed baselines
  const seededBaselineRef = useRef<string | null>(null)
  useMemo(() => {
    if (!baselines || baselines.length === 0) return
    const fp = baselines.map((b) => `${b.id}:${b.value}`).join(",")
    if (seededBaselineRef.current === fp) return
    seededBaselineRef.current = fp

    setEntries((prev) => {
      const next = { ...prev }
      for (const bl of baselines) {
        if (!bl.date) continue
        const key = getDateKey(parseLocalDate(bl.date))
        const existing = next[key] ?? createEmptyIntervalDayEntry(numberOfIntervals)
        // Baseline value = count of positive intervals
        const positiveCount = Math.min(bl.value, numberOfIntervals)
        const intervals: IntervalValue[] = Array.from({ length: numberOfIntervals }, (_, i) =>
          i < positiveCount ? "+" : "-"
        )
        next[key] = { ...existing, intervals, numberOfIntervals }
      }
      return next
    })

    const baselineSnapshot: IntervalWeekEntries = {}
    for (const bl of baselines) {
      if (!bl.date) continue
      const key = getDateKey(parseLocalDate(bl.date))
      const positiveCount = Math.min(bl.value, numberOfIntervals)
      const intervals: IntervalValue[] = Array.from({ length: numberOfIntervals }, (_, i) =>
        i < positiveCount ? "+" : "-"
      )
      baselineSnapshot[key] = createEmptyIntervalDayEntry(numberOfIntervals)
      baselineSnapshot[key].intervals = intervals
    }
    setOriginalBaselineEntries(baselineSnapshot)
  }, [baselines, numberOfIntervals])

  // Min date (first baseline)
  const minDate = useMemo(() => {
    if (!baselines || baselines.length === 0) return undefined
    const dates = baselines.filter((b) => b.date).map((b) => parseLocalDate(b.date))
    if (dates.length === 0) return undefined
    return new Date(Math.min(...dates.map((d) => d.getTime())))
  }, [baselines])

  // Date range
  const dateRange = useMemo(() => {
    if (rangeMode === "week") {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 })
      const end = endOfWeek(anchorDate, { weekStartsOn: 1 })
      return { start, end }
    }
    return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) }
  }, [anchorDate, rangeMode])

  const rangeDays = useMemo(() => {
    const days: Date[] = []
    let cursor = new Date(dateRange.start)
    while (cursor <= dateRange.end) {
      days.push(new Date(cursor))
      cursor = addDays(cursor, 1)
    }
    return days
  }, [dateRange])

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [anchorDate])

  // Labels
  const periodLabel = useMemo(() => {
    return `${format(dateRange.start, "MMM dd")} – ${format(dateRange.end, "MMM dd, yyyy")}`
  }, [dateRange])

  const monthYearLabel = useMemo(() => format(anchorDate, "MMMM yyyy"), [anchorDate])

  // Navigation
  const canGoPrev = useMemo(() => {
    if (!minDate) return true
    return dateRange.start > minDate
  }, [dateRange.start, minDate])

  const goToPrev = useCallback(() => {
    setAnchorDate((d) => rangeMode === "month" ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : addDays(d, -7))
  }, [rangeMode])

  const goToNext = useCallback(() => {
    setAnchorDate((d) => rangeMode === "month" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : addDays(d, 7))
  }, [rangeMode])

  const goToToday = useCallback(() => setAnchorDate(new Date()), [])
  const goToDate = useCallback((date: Date) => setAnchorDate(date), [])

  const changeMode = useCallback((mode: RangeMode) => setRangeMode(mode), [])

  const setRange = useCallback((start: Date, end: Date) => {
    setAnchorDate(start)
    setRangeMode("custom")
  }, [])

  // Entry access
  const getEntry = useCallback((dateKey: string): IntervalDayEntry => {
    return entries[dateKey] ?? createEmptyIntervalDayEntry(numberOfIntervals)
  }, [entries, numberOfIntervals])

  const isToday = useCallback((day: Date) => isTodayFn(day), [])
  const isBaselineDate = useCallback((dateKey: string) => baselineDateKeys.has(dateKey), [baselineDateKeys])

  // Entry mutations
  const toggleInterval = useCallback((dateKey: string, index: number) => {
    setEntries((prev) => {
      const entry = prev[dateKey] ?? createEmptyIntervalDayEntry(numberOfIntervals)
      const intervals = [...entry.intervals]
      intervals[index] = cycleIntervalValue(intervals[index])
      return { ...prev, [dateKey]: { ...entry, intervals } }
    })
  }, [numberOfIntervals])

  const setInitials = useCallback((dateKey: string, value: string) => {
    setEntries((prev) => {
      const entry = prev[dateKey] ?? createEmptyIntervalDayEntry(numberOfIntervals)
      return { ...prev, [dateKey]: { ...entry, initials: value.toUpperCase().slice(0, 3) } }
    })
  }, [numberOfIntervals])

  const setNote = useCallback((dateKey: string, value: string) => {
    setEntries((prev) => {
      const entry = prev[dateKey] ?? createEmptyIntervalDayEntry(numberOfIntervals)
      return { ...prev, [dateKey]: { ...entry, environmentalNote: value } }
    })
  }, [numberOfIntervals])

  // Seed DC records from API
  const seedDcRecords = useCallback((records: { dateKey: string; value: number; environmentalChange?: string | null }[]) => {
    setEntries((prev) => {
      const next = { ...prev }
      for (const rec of records) {
        if (baselineDateKeys.has(rec.dateKey)) continue
        const existing = next[rec.dateKey] ?? createEmptyIntervalDayEntry(numberOfIntervals)
        const positiveCount = Math.min(rec.value, numberOfIntervals)
        const intervals: IntervalValue[] = Array.from({ length: numberOfIntervals }, (_, i) =>
          i < positiveCount ? "+" : "-"
        )
        next[rec.dateKey] = { ...existing, intervals, numberOfIntervals, environmentalNote: rec.environmentalChange ?? existing.environmentalNote }
      }
      return next
    })

    const snapshot: IntervalWeekEntries = {}
    for (const rec of records) {
      if (baselineDateKeys.has(rec.dateKey)) continue
      const positiveCount = Math.min(rec.value, numberOfIntervals)
      const intervals: IntervalValue[] = Array.from({ length: numberOfIntervals }, (_, i) =>
        i < positiveCount ? "+" : "-"
      )
      const entry = createEmptyIntervalDayEntry(numberOfIntervals)
      entry.intervals = intervals
      entry.environmentalNote = rec.environmentalChange ?? ""
      snapshot[rec.dateKey] = entry
    }
    setOriginalDcEntries(snapshot)
  }, [numberOfIntervals, baselineDateKeys])

  // Dirty detection
  const hasBaselineChanges = useMemo(() => {
    for (const key of baselineDateKeys) {
      const current = entries[key]
      const original = originalBaselineEntries[key]
      if (!current && !original) continue
      const currentCount = current ? countPositive(current) : 0
      const originalCount = original ? countPositive(original) : 0
      if (currentCount !== originalCount) return true
    }
    return false
  }, [entries, originalBaselineEntries, baselineDateKeys])

  const hasDcChanges = useMemo(() => {
    const allKeys = new Set([...Object.keys(entries), ...Object.keys(originalDcEntries)])
    for (const key of allKeys) {
      if (baselineDateKeys.has(key)) continue
      const current = entries[key]
      const original = originalDcEntries[key]
      const currentCount = current ? countPositive(current) : 0
      const originalCount = original ? countPositive(original) : 0
      if (currentCount !== originalCount) return true
      if ((current?.environmentalNote ?? "") !== (original?.environmentalNote ?? "")) return true
    }
    return false
  }, [entries, originalDcEntries, baselineDateKeys])

  const getChangedBaselines = useCallback(() => {
    const changed: { id: string; value: number }[] = []
    if (!baselines) return changed
    for (const bl of baselines) {
      if (!bl.date) continue
      const key = getDateKey(parseLocalDate(bl.date))
      const current = entries[key]
      if (!current) continue
      const currentCount = countPositive(current)
      if (currentCount !== bl.value) {
        changed.push({ id: bl.id, value: currentCount })
      }
    }
    return changed
  }, [entries, baselines])

  const getChangedDcDateKeys = useCallback(() => {
    const changed: string[] = []
    const allKeys = new Set([...Object.keys(entries), ...Object.keys(originalDcEntries)])
    for (const key of allKeys) {
      if (baselineDateKeys.has(key)) continue
      const current = entries[key]
      const original = originalDcEntries[key]
      const currentCount = current ? countPositive(current) : 0
      const originalCount = original ? countPositive(original) : 0
      const noteChanged = (current?.environmentalNote ?? "") !== (original?.environmentalNote ?? "")
      if (currentCount !== originalCount || noteChanged) changed.push(key)
    }
    return changed
  }, [entries, originalDcEntries, baselineDateKeys])

  const commitBaseline = useCallback(() => {
    const snapshot: IntervalWeekEntries = {}
    for (const key of baselineDateKeys) {
      if (entries[key]) snapshot[key] = { ...entries[key], intervals: [...entries[key].intervals] }
    }
    setOriginalBaselineEntries(snapshot)
  }, [entries, baselineDateKeys])

  const commitDcValues = useCallback(() => {
    const snapshot: IntervalWeekEntries = {}
    for (const [key, entry] of Object.entries(entries)) {
      if (!baselineDateKeys.has(key)) {
        snapshot[key] = { ...entry, intervals: [...entry.intervals] }
      }
    }
    setOriginalDcEntries(snapshot)
  }, [entries, baselineDateKeys])

  const resetBaseline = useCallback(() => {
    setEntries((prev) => {
      const next = { ...prev }
      for (const key of baselineDateKeys) {
        if (originalBaselineEntries[key]) {
          next[key] = { ...originalBaselineEntries[key], intervals: [...originalBaselineEntries[key].intervals] }
        }
      }
      return next
    })
  }, [originalBaselineEntries, baselineDateKeys])

  const resetDcValues = useCallback(() => {
    setEntries((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (baselineDateKeys.has(key)) continue
        if (originalDcEntries[key]) {
          next[key] = { ...originalDcEntries[key], intervals: [...originalDcEntries[key].intervals] }
        } else {
          delete next[key]
        }
      }
      return next
    })
  }, [originalDcEntries, baselineDateKeys])

  // Stats
  const weeklyAveragePercentage = useMemo(() => {
    const percentages: number[] = []
    for (const day of rangeDays) {
      const key = getDateKey(day)
      const entry = entries[key]
      if (!entry) continue
      const pct = calculateIntervalPercentage(entry)
      if (pct !== null) percentages.push(pct)
    }
    return percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0
  }, [entries, rangeDays])

  const monthlyAveragePercentage = useMemo(() => {
    const monthStart = startOfMonth(anchorDate)
    const monthEnd = endOfMonth(anchorDate)
    const percentages: number[] = []
    let cursor = new Date(monthStart)
    while (cursor <= monthEnd) {
      const key = getDateKey(cursor)
      const entry = entries[key]
      if (entry) {
        const pct = calculateIntervalPercentage(entry)
        if (pct !== null) percentages.push(pct)
      }
      cursor = addDays(cursor, 1)
    }
    return percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0
  }, [entries, anchorDate])

  const staffAvatars = useMemo(() => {
    const set = new Set<string>()
    for (const day of rangeDays) {
      const key = getDateKey(day)
      const entry = entries[key]
      if (entry?.initials) set.add(entry.initials)
    }
    return Array.from(set)
  }, [entries, rangeDays])

  const eventsLoggedCount = useMemo(() => {
    let count = 0
    for (const day of rangeDays) {
      const key = getDateKey(day)
      const entry = entries[key]
      if (entry?.environmentalNote?.trim()) count++
    }
    return count
  }, [entries, rangeDays])

  return {
    // Range
    rangeMode, dateRange, rangeDays, weekDays, anchorDate,
    periodLabel, monthYearLabel,
    minDate, canGoPrev,
    // Navigation
    goToPrev, goToNext, goToToday, goToDate, changeMode, setRange,
    // Entries
    entries, getEntry, toggleInterval, setInitials, setNote,
    // Checks
    isToday, isBaselineDate,
    // DC seeding
    seedDcRecords,
    // Dirty tracking
    hasBaselineChanges, hasDcChanges,
    getChangedBaselines, getChangedDcDateKeys,
    commitBaseline, commitDcValues,
    resetBaseline, resetDcValues,
    // Stats
    weeklyAveragePercentage, monthlyAveragePercentage,
    staffAvatars, staffCount: staffAvatars.length,
    eventsLoggedCount,
  }
}
