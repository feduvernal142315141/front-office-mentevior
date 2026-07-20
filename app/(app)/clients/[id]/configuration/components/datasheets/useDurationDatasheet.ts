import { useCallback, useMemo, useRef, useState } from "react"
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isToday as isTodayFn } from "date-fns"
import type { ClientServicePlanItemBaseline } from "@/lib/types/client-service-plan.types"
import { ServicePlanValueType } from "@/lib/modules/service-plans/constants/service-plan-data-collection.enums"
import {
  type DurationDayEntry,
  type DurationWeekEntries,
  createEmptyDurationDayEntry,
  calculateDailyAggregate,
} from "./duration-datasheet.types"
import { getDateKey, parseLocalDate } from "./datasheet-utils"

export type RangeMode = "week" | "month" | "custom"

export function useDurationDatasheet(
  numberOfRecordings: number,
  dailyValueMethod: ServicePlanValueType,
  weeklyValueMethod: ServicePlanValueType,
  baselines?: ClientServicePlanItemBaseline[],
) {
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [rangeMode, setRangeMode] = useState<RangeMode>("week")
  const [entries, setEntries] = useState<DurationWeekEntries>({})
  const [originalDcEntries, setOriginalDcEntries] = useState<DurationWeekEntries>({})

  const baselineDateKeys = useMemo(() => {
    if (!baselines || baselines.length === 0) return new Set<string>()
    return new Set(baselines.filter((b) => b.date).map((b) => getDateKey(parseLocalDate(b.date))))
  }, [baselines])

  const [originalBaselineEntries, setOriginalBaselineEntries] = useState<DurationWeekEntries>({})

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
        const existing = next[key] ?? createEmptyDurationDayEntry(numberOfRecordings)
        // Baseline value = aggregate. Put it in first recording
        const recordings: (number | null)[] = Array.from({ length: numberOfRecordings }, () => null)
        recordings[0] = bl.value
        next[key] = { ...existing, recordings, numberOfRecordings }
      }
      return next
    })

    const snapshot: DurationWeekEntries = {}
    for (const bl of baselines) {
      if (!bl.date) continue
      const key = getDateKey(parseLocalDate(bl.date))
      const entry = createEmptyDurationDayEntry(numberOfRecordings)
      entry.recordings[0] = bl.value
      snapshot[key] = entry
    }
    setOriginalBaselineEntries(snapshot)
  }, [baselines, numberOfRecordings])

  const minDate = useMemo(() => {
    if (!baselines || baselines.length === 0) return undefined
    const dates = baselines.filter((b) => b.date).map((b) => parseLocalDate(b.date))
    return dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined
  }, [baselines])

  // Date range
  const dateRange = useMemo(() => {
    if (rangeMode === "week") {
      return { start: startOfWeek(anchorDate, { weekStartsOn: 0 }), end: endOfWeek(anchorDate, { weekStartsOn: 0 }) }
    }
    return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) }
  }, [anchorDate, rangeMode])

  const rangeDays = useMemo(() => {
    const days: Date[] = []
    let cursor = new Date(dateRange.start)
    while (cursor <= dateRange.end) { days.push(new Date(cursor)); cursor = addDays(cursor, 1) }
    return days
  }, [dateRange])

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [anchorDate])

  const periodLabel = useMemo(() => `${format(dateRange.start, "MMM dd")} – ${format(dateRange.end, "MMM dd, yyyy")}`, [dateRange])
  const monthYearLabel = useMemo(() => format(anchorDate, "MMMM yyyy"), [anchorDate])

  const canGoPrev = useMemo(() => !minDate || dateRange.start > minDate, [dateRange.start, minDate])

  const goToPrev = useCallback(() => {
    setAnchorDate((d) => rangeMode === "month" ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : addDays(d, -7))
  }, [rangeMode])
  const goToNext = useCallback(() => {
    setAnchorDate((d) => rangeMode === "month" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : addDays(d, 7))
  }, [rangeMode])
  const goToToday = useCallback(() => setAnchorDate(new Date()), [])
  const goToDate = useCallback((date: Date) => setAnchorDate(date), [])
  const changeMode = useCallback((mode: RangeMode) => setRangeMode(mode), [])
  const setRange = useCallback((start: Date) => { setAnchorDate(start); setRangeMode("custom") }, [])

  const getEntry = useCallback((dateKey: string): DurationDayEntry => {
    return entries[dateKey] ?? createEmptyDurationDayEntry(numberOfRecordings)
  }, [entries, numberOfRecordings])

  const isToday = useCallback((day: Date) => isTodayFn(day), [])
  const isBaselineDate = useCallback((dateKey: string) => baselineDateKeys.has(dateKey), [baselineDateKeys])

  // Entry mutations
  const setRecording = useCallback((dateKey: string, index: number, value: number | null) => {
    setEntries((prev) => {
      const entry = prev[dateKey] ?? createEmptyDurationDayEntry(numberOfRecordings)
      const recordings = [...entry.recordings]
      recordings[index] = value
      return { ...prev, [dateKey]: { ...entry, recordings } }
    })
  }, [numberOfRecordings])

  const setInitials = useCallback((dateKey: string, value: string) => {
    setEntries((prev) => {
      const entry = prev[dateKey] ?? createEmptyDurationDayEntry(numberOfRecordings)
      return { ...prev, [dateKey]: { ...entry, initials: value.toUpperCase().slice(0, 3) } }
    })
  }, [numberOfRecordings])

  const setNote = useCallback((dateKey: string, value: string) => {
    setEntries((prev) => {
      const entry = prev[dateKey] ?? createEmptyDurationDayEntry(numberOfRecordings)
      return { ...prev, [dateKey]: { ...entry, environmentalNote: value } }
    })
  }, [numberOfRecordings])

  // Seed DC records
  const seedDcRecords = useCallback((records: { dateKey: string; value: number; environmentalChange?: string | null }[]) => {
    setEntries((prev) => {
      const next = { ...prev }
      for (const rec of records) {
        if (baselineDateKeys.has(rec.dateKey)) continue
        const existing = next[rec.dateKey] ?? createEmptyDurationDayEntry(numberOfRecordings)
        // Value = aggregate, put in first recording
        const recordings: (number | null)[] = Array.from({ length: numberOfRecordings }, () => null)
        recordings[0] = rec.value
        next[rec.dateKey] = { ...existing, recordings, numberOfRecordings, environmentalNote: rec.environmentalChange ?? existing.environmentalNote }
      }
      return next
    })

    const snapshot: DurationWeekEntries = {}
    for (const rec of records) {
      if (baselineDateKeys.has(rec.dateKey)) continue
      const entry = createEmptyDurationDayEntry(numberOfRecordings)
      entry.recordings[0] = rec.value
      entry.environmentalNote = rec.environmentalChange ?? ""
      snapshot[rec.dateKey] = entry
    }
    setOriginalDcEntries(snapshot)
  }, [numberOfRecordings, baselineDateKeys])

  // Dirty detection
  const hasBaselineChanges = useMemo(() => {
    for (const key of baselineDateKeys) {
      const current = entries[key]
      const original = originalBaselineEntries[key]
      const currentAgg = current ? calculateDailyAggregate(current, dailyValueMethod) : null
      const originalAgg = original ? calculateDailyAggregate(original, dailyValueMethod) : null
      if (currentAgg !== originalAgg) return true
    }
    return false
  }, [entries, originalBaselineEntries, baselineDateKeys, dailyValueMethod])

  const hasDcChanges = useMemo(() => {
    const allKeys = new Set([...Object.keys(entries), ...Object.keys(originalDcEntries)])
    for (const key of allKeys) {
      if (baselineDateKeys.has(key)) continue
      const current = entries[key]
      const original = originalDcEntries[key]
      const currentAgg = current ? calculateDailyAggregate(current, dailyValueMethod) : null
      const originalAgg = original ? calculateDailyAggregate(original, dailyValueMethod) : null
      if (currentAgg !== originalAgg) return true
      if ((current?.environmentalNote ?? "") !== (original?.environmentalNote ?? "")) return true
    }
    return false
  }, [entries, originalDcEntries, baselineDateKeys, dailyValueMethod])

  const getChangedBaselines = useCallback(() => {
    const changed: { id: string; value: number }[] = []
    if (!baselines) return changed
    for (const bl of baselines) {
      if (!bl.date) continue
      const key = getDateKey(parseLocalDate(bl.date))
      const current = entries[key]
      if (!current) continue
      const agg = calculateDailyAggregate(current, dailyValueMethod)
      if (agg !== null && agg !== bl.value) {
        changed.push({ id: bl.id, value: Math.round(agg * 100) / 100 })
      }
    }
    return changed
  }, [entries, baselines, dailyValueMethod])

  const getChangedDcDateKeys = useCallback(() => {
    const changed: string[] = []
    const allKeys = new Set([...Object.keys(entries), ...Object.keys(originalDcEntries)])
    for (const key of allKeys) {
      if (baselineDateKeys.has(key)) continue
      const current = entries[key]
      const original = originalDcEntries[key]
      const currentAgg = current ? calculateDailyAggregate(current, dailyValueMethod) : null
      const originalAgg = original ? calculateDailyAggregate(original, dailyValueMethod) : null
      const noteChanged = (current?.environmentalNote ?? "") !== (original?.environmentalNote ?? "")
      if (currentAgg !== originalAgg || noteChanged) changed.push(key)
    }
    return changed
  }, [entries, originalDcEntries, baselineDateKeys, dailyValueMethod])

  const commitBaseline = useCallback(() => {
    const snapshot: DurationWeekEntries = {}
    for (const key of baselineDateKeys) {
      if (entries[key]) snapshot[key] = { ...entries[key], recordings: [...entries[key].recordings] }
    }
    setOriginalBaselineEntries(snapshot)
  }, [entries, baselineDateKeys])

  const commitDcValues = useCallback(() => {
    const snapshot: DurationWeekEntries = {}
    for (const [key, entry] of Object.entries(entries)) {
      if (!baselineDateKeys.has(key)) snapshot[key] = { ...entry, recordings: [...entry.recordings] }
    }
    setOriginalDcEntries(snapshot)
  }, [entries, baselineDateKeys])

  const resetBaseline = useCallback(() => {
    setEntries((prev) => {
      const next = { ...prev }
      for (const key of baselineDateKeys) {
        if (originalBaselineEntries[key]) next[key] = { ...originalBaselineEntries[key], recordings: [...originalBaselineEntries[key].recordings] }
      }
      return next
    })
  }, [originalBaselineEntries, baselineDateKeys])

  const resetDcValues = useCallback(() => {
    setEntries((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (baselineDateKeys.has(key)) continue
        if (originalDcEntries[key]) next[key] = { ...originalDcEntries[key], recordings: [...originalDcEntries[key].recordings] }
        else delete next[key]
      }
      return next
    })
  }, [originalDcEntries, baselineDateKeys])

  // Stats
  const weeklyAggregate = useMemo(() => {
    const dailyAggs: number[] = []
    for (const day of rangeDays) {
      const key = getDateKey(day)
      const entry = entries[key]
      if (!entry) continue
      const agg = calculateDailyAggregate(entry, dailyValueMethod)
      if (agg !== null) dailyAggs.push(agg)
    }
    if (dailyAggs.length === 0) return 0
    if (weeklyValueMethod === ServicePlanValueType.TOTAL) {
      return Math.round(dailyAggs.reduce((a, b) => a + b, 0) * 100) / 100
    }
    return Math.round((dailyAggs.reduce((a, b) => a + b, 0) / dailyAggs.length) * 100) / 100
  }, [entries, rangeDays, dailyValueMethod, weeklyValueMethod])

  const monthlyAverage = useMemo(() => {
    const monthStart = startOfMonth(anchorDate)
    const monthEnd = endOfMonth(anchorDate)
    const dailyAggs: number[] = []
    let cursor = new Date(monthStart)
    while (cursor <= monthEnd) {
      const key = getDateKey(cursor)
      const entry = entries[key]
      if (entry) {
        const agg = calculateDailyAggregate(entry, dailyValueMethod)
        if (agg !== null) dailyAggs.push(agg)
      }
      cursor = addDays(cursor, 1)
    }
    if (dailyAggs.length === 0) return 0
    return Math.round((dailyAggs.reduce((a, b) => a + b, 0) / dailyAggs.length) * 100) / 100
  }, [entries, anchorDate, dailyValueMethod])

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
      if (entries[key]?.environmentalNote?.trim()) count++
    }
    return count
  }, [entries, rangeDays])

  return {
    rangeMode, dateRange, rangeDays, weekDays, anchorDate,
    periodLabel, monthYearLabel, minDate, canGoPrev,
    goToPrev, goToNext, goToToday, goToDate, changeMode, setRange,
    entries, getEntry, setRecording, setInitials, setNote,
    isToday, isBaselineDate,
    seedDcRecords,
    hasBaselineChanges, hasDcChanges,
    getChangedBaselines, getChangedDcDateKeys,
    commitBaseline, commitDcValues, resetBaseline, resetDcValues,
    weeklyAggregate, monthlyAverage,
    staffAvatars, staffCount: staffAvatars.length, eventsLoggedCount,
  }
}
