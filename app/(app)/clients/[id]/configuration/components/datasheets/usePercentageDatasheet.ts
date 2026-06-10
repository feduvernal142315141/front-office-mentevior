"use client"

import { useCallback, useMemo, useState } from "react"
import { startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, addDays, format, isToday as isTodayFn } from "date-fns"
import {
  type PercentageDayEntry,
  type PercentageWeekEntries,
  createEmptyPercentageDayEntry,
  getDateKey,
  calculatePercentage,
  cycleTrialResult,
} from "./percentage-datasheet.types"

export function usePercentageDatasheet() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [entries, setEntries] = useState<PercentageWeekEntries>({})

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
    (dateKey: string): PercentageDayEntry => entries[dateKey] ?? createEmptyPercentageDayEntry(),
    [entries]
  )

  const updateEntry = useCallback(
    (dateKey: string, updater: (prev: PercentageDayEntry) => PercentageDayEntry) => {
      setEntries((prev) => ({
        ...prev,
        [dateKey]: updater(prev[dateKey] ?? createEmptyPercentageDayEntry()),
      }))
    },
    []
  )

  const setNumberOfTrials = useCallback(
    (dateKey: string, count: number) => {
      const newCount = Math.max(1, Math.floor(count))
      updateEntry(dateKey, (e) => {
        const currentTrials = e.trials
        let newTrials = [...currentTrials]
        if (newCount > currentTrials.length) {
          // Add empty trials
          const toAdd = newCount - currentTrials.length
          newTrials = [...currentTrials, ...Array.from({ length: toAdd }, (): { result: null } => ({ result: null }))]
        } else if (newCount < currentTrials.length) {
          // Trim from the end
          newTrials = currentTrials.slice(0, newCount)
        }
        return { ...e, numberOfTrials: newCount, trials: newTrials }
      })
    },
    [updateEntry]
  )

  const incrementTrials = useCallback(
    (dateKey: string) => {
      const entry = entries[dateKey] ?? createEmptyPercentageDayEntry()
      setNumberOfTrials(dateKey, entry.numberOfTrials + 1)
    },
    [entries, setNumberOfTrials]
  )

  const decrementTrials = useCallback(
    (dateKey: string) => {
      const entry = entries[dateKey] ?? createEmptyPercentageDayEntry()
      setNumberOfTrials(dateKey, entry.numberOfTrials - 1)
    },
    [entries, setNumberOfTrials]
  )

  const toggleTrial = useCallback(
    (dateKey: string, trialIndex: number) => {
      updateEntry(dateKey, (e) => {
        if (trialIndex < 0 || trialIndex >= e.trials.length) return e
        const newTrials = [...e.trials]
        newTrials[trialIndex] = { result: cycleTrialResult(e.trials[trialIndex].result) }
        return { ...e, trials: newTrials }
      })
    },
    [updateEntry]
  )

  const setInitials = useCallback(
    (dateKey: string, value: string) =>
      updateEntry(dateKey, (e) => ({ ...e, initials: value.toUpperCase().slice(0, 3) })),
    [updateEntry]
  )

  const setNote = useCallback(
    (dateKey: string, value: string) =>
      updateEntry(dateKey, (e) => ({ ...e, environmentalNote: value })),
    [updateEntry]
  )

  const weeklyAveragePercentage = useMemo(() => {
    const percentages: number[] = []
    for (const day of weekDays) {
      const entry = entries[getDateKey(day)]
      if (entry) {
        const pct = calculatePercentage(entry)
        if (pct !== null) percentages.push(pct)
      }
    }
    if (percentages.length === 0) return 0
    return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
  }, [weekDays, entries])

  const monthlyAveragePercentage = useMemo(() => {
    const monthStart = startOfMonth(weekStart)
    const monthEnd = endOfMonth(weekStart)
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const percentages: number[] = []
    for (const day of allDays) {
      const entry = entries[getDateKey(day)]
      if (entry) {
        const pct = calculatePercentage(entry)
        if (pct !== null) percentages.push(pct)
      }
    }
    if (percentages.length === 0) return 0
    return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
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
    setNumberOfTrials,
    incrementTrials,
    decrementTrials,
    toggleTrial,
    setInitials,
    setNote,
    weeklyAveragePercentage,
    monthlyAveragePercentage,
    eventsLoggedCount,
    staffAvatars,
    staffCount: staffAvatars.length,
    isToday,
  }
}
