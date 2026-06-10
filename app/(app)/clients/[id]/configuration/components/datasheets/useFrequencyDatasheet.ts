"use client"

import { useCallback, useMemo, useState } from "react"
import { startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, addDays, format, isToday as isTodayFn } from "date-fns"
import {
  type DayEntry,
  type WeekEntries,
  createEmptyDayEntry,
  getDateKey,
} from "./frequency-datasheet.types"

export function useFrequencyDatasheet() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [entries, setEntries] = useState<WeekEntries>({})

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
  }
}
