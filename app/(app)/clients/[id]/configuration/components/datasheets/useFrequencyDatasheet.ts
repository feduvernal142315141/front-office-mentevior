"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, addDays, format, isToday as isTodayFn } from "date-fns"
import {
  type DayEntry,
  type WeekEntries,
  createEmptyDayEntry,
  getDateKey,
  parseLocalDate,
} from "./frequency-datasheet.types"
import type { ClientServicePlanItemBaseline } from "@/lib/types/client-service-plan.types"

export function useFrequencyDatasheet(baselines?: ClientServicePlanItemBaseline[]) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [entries, setEntries] = useState<WeekEntries>({})

  // Track which item's baselines we've already seeded to avoid re-seeding on every render
  const seededBaselineRef = useRef<string | null>(null)

  // Seed entries from baseline data when baselines change (new item selected)
  useEffect(() => {
    if (!baselines || baselines.length === 0) {
      seededBaselineRef.current = null
      return
    }

    // Build a fingerprint to detect item changes
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
      const latestDate = parseLocalDate(sorted[0].date)
      setWeekStart(startOfWeek(latestDate, { weekStartsOn: 1 }))
    }
  }, [baselines])

  const weekDays = useMemo<Date[]>(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const monthYearLabel = useMemo(() => format(weekStart, "MMMM yyyy"), [weekStart])

  const periodLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    return `${format(weekStart, "MMM dd")} - ${format(end, "MMM dd")}`
  }, [weekStart])

  const goToPrevWeek = useCallback(() => setWeekStart((w) => addWeeks(w, -1)), [])
  const goToNextWeek = useCallback(() => setWeekStart((w) => addWeeks(w, 1)), [])
  const goToCurrentWeek = useCallback(
    () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })),
    []
  )

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

  const weeklyTotal = useMemo(() => {
    return weekDays.reduce((sum, day) => {
      const key = getDateKey(day)
      return sum + (entries[key]?.occurrences ?? 0)
    }, 0)
  }, [weekDays, entries])

  const monthlyAverage = useMemo(() => {
    const monthStart = startOfMonth(weekStart)
    const monthEnd = endOfMonth(weekStart)
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
  }, [weekStart, entries])

  const eventsLoggedCount = useMemo(() => {
    return weekDays.filter((day) => {
      const key = getDateKey(day)
      return (entries[key]?.environmentalNote ?? "").trim().length > 0
    }).length
  }, [weekDays, entries])

  const staffAvatars = useMemo(() => {
    const set = new Set<string>()
    for (const day of weekDays) {
      const initials = entries[getDateKey(day)]?.initials?.trim()
      if (initials) set.add(initials)
    }
    return Array.from(set)
  }, [weekDays, entries])

  const isToday = useCallback((date: Date) => isTodayFn(date), [])

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

  // Recompute snapshot when baselines change (item switch)
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

  // After a successful save, update the snapshot so hasBaselineChanges becomes false
  const commitBaseline = useCallback(() => {
    const snap: WeekEntries = {}
    for (const key of baselineDateKeys) {
      const current = entries[key]
      if (current) snap[key] = { ...current }
    }
    setOriginalBaselineEntries(snap)
  }, [baselineDateKeys, entries])

  // Returns only the baselines whose value changed, with their API id
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

  return {
    weekStart,
    weekDays,
    periodLabel,
    monthYearLabel,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    entries,
    getEntry,
    incrementOccurrences,
    decrementOccurrences,
    setOccurrences,
    setInitials,
    setNote,
    weeklyTotal,
    monthlyAverage,
    eventsLoggedCount,
    staffAvatars,
    staffCount: staffAvatars.length,
    isToday,
    isBaselineDate,
    hasBaselineChanges,
    resetBaseline,
    commitBaseline,
    getChangedBaselines,
  }
}
