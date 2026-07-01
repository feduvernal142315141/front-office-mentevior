"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  addMonths,
  addDays,
  format,
  isToday as isTodayFn,
} from "date-fns"
import {
  type DayEntry,
  type WeekEntries,
  createEmptyDayEntry,
  getDateKey,
  parseLocalDate,
} from "./frequency-datasheet.types"
import type { ClientServicePlanItemBaseline } from "@/lib/types/client-service-plan.types"

// ─── Range mode types ────────────────────────────────────────────────────────

export type RangeMode = "week" | "month" | "custom"

export interface DateRange {
  start: Date
  end: Date
}

export function useFrequencyDatasheet(baselines?: ClientServicePlanItemBaseline[]) {
  const [rangeMode, setRangeMode] = useState<RangeMode>("week")
  const [anchor, setAnchor] = useState<Date>(() => new Date())
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [entries, setEntries] = useState<WeekEntries>({})

  // Track which item's baselines we've already seeded to avoid re-seeding on every render
  const seededBaselineRef = useRef<string | null>(null)

  // Seed entries from baseline data when baselines change (new item selected)
  useEffect(() => {
    if (!baselines || baselines.length === 0) {
      seededBaselineRef.current = null
      return
    }

    const fingerprint = baselines.map((b) => b.id).sort().join(",")
    if (seededBaselineRef.current === fingerprint) return
    seededBaselineRef.current = fingerprint

    const seeded: WeekEntries = {}
    for (const bl of baselines) {
      if (!bl.date || bl.value == null) continue
      const d = parseLocalDate(bl.date)
      const key = getDateKey(d)
      seeded[key] = {
        occurrences: bl.value,
        initials: "",
        environmentalNote: bl.environmentalChanges ?? "",
      }
    }
    setEntries(seeded)

    // Navigate to the week of the most recent baseline
    const sorted = [...baselines]
      .filter((b) => b.date)
      .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime())
    if (sorted.length > 0) {
      setAnchor(parseLocalDate(sorted[0].date))
    }
  }, [baselines])

  // ─── Computed range based on mode ────────────────────────────────────────

  const dateRange = useMemo<DateRange>(() => {
    if (rangeMode === "custom" && customRange) return customRange
    if (rangeMode === "month") {
      return {
        start: startOfMonth(anchor),
        end: endOfMonth(anchor),
      }
    }
    // week (default)
    return {
      start: startOfWeek(anchor, { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 }),
    }
  }, [rangeMode, anchor, customRange])

  const rangeDays = useMemo<Date[]>(
    () => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
    [dateRange]
  )

  // Legacy compat: weekStart = dateRange.start
  const weekStart = dateRange.start

  // Legacy compat: weekDays = rangeDays (some consumers use this)
  const weekDays = rangeDays

  // ─── Labels ──────────────────────────────────────────────────────────────

  const monthYearLabel = useMemo(() => format(anchor, "MMMM yyyy"), [anchor])

  const periodLabel = useMemo(() => {
    const s = dateRange.start
    const e = dateRange.end
    if (rangeMode === "month") {
      return format(s, "MMMM yyyy")
    }
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
    if (sameMonth) {
      return `${format(s, "MMM dd")} - ${format(e, "dd")}`
    }
    return `${format(s, "MMM dd")} - ${format(e, "MMM dd")}`
  }, [dateRange, rangeMode])

  // ─── Fetch range as YYYY-MM-DD strings ───────────────────────────────────

  const fetchStartDate = useMemo(() => format(dateRange.start, "yyyy-MM-dd"), [dateRange.start])
  const fetchEndDate = useMemo(() => format(dateRange.end, "yyyy-MM-dd"), [dateRange.end])

  // ─── Navigation ──────────────────────────────────────────────────────────

  const goToPrev = useCallback(() => {
    if (rangeMode === "month") {
      setAnchor((a) => addMonths(a, -1))
    } else if (rangeMode === "custom" && customRange) {
      const diff = customRange.end.getTime() - customRange.start.getTime()
      setCustomRange({
        start: new Date(customRange.start.getTime() - diff - 86400000),
        end: new Date(customRange.end.getTime() - diff - 86400000),
      })
    } else {
      setAnchor((a) => addWeeks(a, -1))
    }
  }, [rangeMode, customRange])

  const goToNext = useCallback(() => {
    if (rangeMode === "month") {
      setAnchor((a) => addMonths(a, 1))
    } else if (rangeMode === "custom" && customRange) {
      const diff = customRange.end.getTime() - customRange.start.getTime()
      setCustomRange({
        start: new Date(customRange.start.getTime() + diff + 86400000),
        end: new Date(customRange.end.getTime() + diff + 86400000),
      })
    } else {
      setAnchor((a) => addWeeks(a, 1))
    }
  }, [rangeMode, customRange])

  const goToToday = useCallback(() => {
    setAnchor(new Date())
    if (rangeMode === "custom") {
      setRangeMode("week")
      setCustomRange(null)
    }
  }, [rangeMode])

  // Jump to a specific date (sets anchor)
  const goToDate = useCallback((date: Date) => {
    setAnchor(date)
  }, [])

  // Set custom range directly
  const setRange = useCallback((start: Date, end: Date) => {
    setRangeMode("custom")
    setCustomRange({ start, end })
    setAnchor(start)
  }, [])

  // Change mode (week/month/custom)
  const changeMode = useCallback((mode: RangeMode) => {
    setRangeMode(mode)
    if (mode !== "custom") setCustomRange(null)
  }, [])

  // ─── Legacy compat: goToPrevWeek / goToNextWeek / goToCurrentWeek ─────

  const goToPrevWeek = goToPrev
  const goToNextWeek = goToNext
  const goToCurrentWeek = goToToday

  // ─── Entry CRUD ──────────────────────────────────────────────────────────

  const getEntry = useCallback(
    (dateKey: string): DayEntry => entries[dateKey] ?? createEmptyDayEntry(),
    [entries]
  )

  const updateEntry = useCallback(
    (dateKey: string, updater: (prev: DayEntry) => DayEntry) => {
      setEntries((prev) => ({
        ...prev,
        [dateKey]: updater(prev[dateKey] ?? createEmptyDayEntry()),
      }))
    },
    []
  )

  const incrementOccurrences = useCallback(
    (dateKey: string) => updateEntry(dateKey, (e) => ({ ...e, occurrences: e.occurrences + 1 })),
    [updateEntry]
  )

  const decrementOccurrences = useCallback(
    (dateKey: string) =>
      updateEntry(dateKey, (e) => ({
        ...e,
        occurrences: Math.max(0, e.occurrences - 1),
      })),
    [updateEntry]
  )

  const setOccurrences = useCallback(
    (dateKey: string, value: number) =>
      updateEntry(dateKey, (e) => ({
        ...e,
        occurrences: Math.max(0, Math.floor(value)),
      })),
    [updateEntry]
  )

  const setInitials = useCallback(
    (dateKey: string, value: string) =>
      updateEntry(dateKey, (e) => ({
        ...e,
        initials: value.toUpperCase().slice(0, 3),
      })),
    [updateEntry]
  )

  const setNote = useCallback(
    (dateKey: string, value: string) =>
      updateEntry(dateKey, (e) => ({ ...e, environmentalNote: value })),
    [updateEntry]
  )

  // ─── Stats ───────────────────────────────────────────────────────────────

  const weeklyTotal = useMemo(() => {
    return rangeDays.reduce((sum, day) => {
      const key = getDateKey(day)
      return sum + (entries[key]?.occurrences ?? 0)
    }, 0)
  }, [rangeDays, entries])

  const monthlyAverage = useMemo(() => {
    const monthStart = startOfMonth(anchor)
    const monthEnd = endOfMonth(anchor)
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    let total = 0
    let daysWithData = 0
    for (const day of allDays) {
      const entry = entries[getDateKey(day)]
      if (entry && entry.occurrences > 0) {
        total += entry.occurrences
        daysWithData++
      }
    }

    return daysWithData > 0 ? total / daysWithData : 0
  }, [anchor, entries])

  const eventsLoggedCount = useMemo(() => {
    return rangeDays.filter((day) => {
      const key = getDateKey(day)
      return (entries[key]?.environmentalNote ?? "").trim().length > 0
    }).length
  }, [rangeDays, entries])

  const staffAvatars = useMemo(() => {
    const set = new Set<string>()
    for (const day of rangeDays) {
      const initials = entries[getDateKey(day)]?.initials?.trim()
      if (initials) set.add(initials)
    }
    return Array.from(set)
  }, [rangeDays, entries])

  const isToday = useCallback((date: Date) => isTodayFn(date), [])

  // ─── Baseline tracking ───────────────────────────────────────────────────

  const baselineDateKeys = useMemo(() => {
    if (!baselines || baselines.length === 0) return new Set<string>()
    const keys = new Set<string>()
    for (const bl of baselines) {
      if (!bl.date) continue
      keys.add(getDateKey(parseLocalDate(bl.date)))
    }
    return keys
  }, [baselines])

  const isBaselineDate = useCallback(
    (dateKey: string) => baselineDateKeys.has(dateKey),
    [baselineDateKeys]
  )

  // Mutable snapshot of baseline values for dirty detection — updated on save
  const [originalBaselineEntries, setOriginalBaselineEntries] = useState<WeekEntries>({})

  useEffect(() => {
    if (!baselines || baselines.length === 0) {
      setOriginalBaselineEntries({})
      return
    }
    const snap: WeekEntries = {}
    for (const bl of baselines) {
      if (!bl.date || bl.value == null) continue
      const key = getDateKey(parseLocalDate(bl.date))
      snap[key] = {
        occurrences: bl.value,
        initials: "",
        environmentalNote: bl.environmentalChanges ?? "",
      }
    }
    setOriginalBaselineEntries(snap)
  }, [baselines])

  const hasBaselineChanges = useMemo(() => {
    for (const key of baselineDateKeys) {
      const original = originalBaselineEntries[key]
      const current = entries[key]
      if (!original && !current) continue
      if (!original || !current) return true
      if (original.occurrences !== current.occurrences) return true
      if (original.environmentalNote !== current.environmentalNote) return true
    }
    return false
  }, [baselineDateKeys, originalBaselineEntries, entries])

  const resetBaseline = useCallback(() => {
    setEntries((prev) => {
      const restored = { ...prev }
      for (const key of baselineDateKeys) {
        const original = originalBaselineEntries[key]
        if (original) {
          restored[key] = { ...original }
        }
      }
      return restored
    })
  }, [baselineDateKeys, originalBaselineEntries])

  const commitBaseline = useCallback(() => {
    const snap: WeekEntries = {}
    for (const key of baselineDateKeys) {
      const current = entries[key]
      if (current) snap[key] = { ...current }
    }
    setOriginalBaselineEntries(snap)
  }, [baselineDateKeys, entries])

  const getChangedBaselines = useCallback(() => {
    if (!baselines) return []
    const changed: { id: string; value: number }[] = []
    for (const bl of baselines) {
      if (!bl.date || !bl.id) continue
      const key = getDateKey(parseLocalDate(bl.date))
      const current = entries[key]
      if (!current) continue
      if (current.occurrences !== bl.value) {
        changed.push({ id: bl.id, value: current.occurrences })
      }
    }
    return changed
  }, [baselines, entries])

  // ─── DC values dirty detection ───────────────────────────────────────────

  const [originalDcEntries, setOriginalDcEntries] = useState<WeekEntries>({})

  /** Seed DC records from API: sets entries + snapshot atomically so hasDcChanges stays false */
  const seedDcRecords = useCallback((dcDateValues: { dateKey: string; value: number }[]) => {
    const snap: WeekEntries = {}
    const valuesToSet: { dateKey: string; value: number }[] = []
    for (const { dateKey, value } of dcDateValues) {
      if (baselineDateKeys.has(dateKey)) continue
      snap[dateKey] = { occurrences: value, initials: "", environmentalNote: "" }
      valuesToSet.push({ dateKey, value })
    }
    // Update entries and snapshot in same React batch
    setEntries((prev) => {
      const next = { ...prev }
      for (const { dateKey, value } of valuesToSet) {
        next[dateKey] = {
          occurrences: Math.max(0, Math.floor(value)),
          initials: prev[dateKey]?.initials ?? "",
          environmentalNote: prev[dateKey]?.environmentalNote ?? "",
        }
      }
      return next
    })
    setOriginalDcEntries(snap)
  }, [baselineDateKeys])

  const hasDcChanges = useMemo(() => {
    for (const [key, entry] of Object.entries(entries)) {
      if (baselineDateKeys.has(key)) continue
      const original = originalDcEntries[key]
      const currentVal = entry.occurrences
      const originalVal = original?.occurrences ?? 0
      if (currentVal !== originalVal) return true
    }
    return false
  }, [entries, baselineDateKeys, originalDcEntries])

  const commitDcValues = useCallback(() => {
    const snap: WeekEntries = {}
    for (const [key, entry] of Object.entries(entries)) {
      if (baselineDateKeys.has(key)) continue
      snap[key] = { ...entry }
    }
    setOriginalDcEntries(snap)
  }, [entries, baselineDateKeys])

  /** Restore DC entries to their original API values */
  const resetDcValues = useCallback(() => {
    setEntries((prev) => {
      const restored = { ...prev }
      // Reset non-baseline keys to original DC values
      for (const key of Object.keys(restored)) {
        if (baselineDateKeys.has(key)) continue
        const original = originalDcEntries[key]
        if (original) {
          restored[key] = { ...original }
        } else {
          restored[key] = createEmptyDayEntry()
        }
      }
      return restored
    })
  }, [baselineDateKeys, originalDcEntries])

  const getChangedDcDateKeys = useCallback(() => {
    const changed: string[] = []
    for (const [key, entry] of Object.entries(entries)) {
      if (baselineDateKeys.has(key)) continue
      const original = originalDcEntries[key]
      const currentVal = entry.occurrences
      const originalVal = original?.occurrences ?? 0
      if (currentVal !== originalVal) changed.push(key)
    }
    return changed
  }, [entries, baselineDateKeys, originalDcEntries])

  return {
    // Range
    rangeMode,
    dateRange,
    changeMode,
    setRange,
    goToDate,
    fetchStartDate,
    fetchEndDate,
    // Legacy compat
    weekStart,
    weekDays,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    // Navigation
    goToPrev,
    goToNext,
    goToToday,
    // Labels
    periodLabel,
    monthYearLabel,
    // Grid
    rangeDays,
    entries,
    getEntry,
    incrementOccurrences,
    decrementOccurrences,
    setOccurrences,
    setInitials,
    setNote,
    // Stats
    weeklyTotal,
    monthlyAverage,
    eventsLoggedCount,
    staffAvatars,
    staffCount: staffAvatars.length,
    // Helpers
    isToday,
    isBaselineDate,
    // Baseline tracking
    hasBaselineChanges,
    resetBaseline,
    commitBaseline,
    getChangedBaselines,
    // DC values
    hasDcChanges,
    seedDcRecords,
    commitDcValues,
    resetDcValues,
    getChangedDcDateKeys,
  }
}
