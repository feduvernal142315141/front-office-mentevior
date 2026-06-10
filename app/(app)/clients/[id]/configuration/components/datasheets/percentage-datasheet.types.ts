export type TrialResult = "yes" | "no" | null

export interface TrialEntry {
  result: TrialResult
}

export interface PercentageDayEntry {
  trials: TrialEntry[]
  numberOfTrials: number
  initials: string
  environmentalNote: string
}

export type PercentageWeekEntries = Record<string, PercentageDayEntry>

const DEFAULT_TRIALS = 10

export function createEmptyPercentageDayEntry(numberOfTrials = DEFAULT_TRIALS): PercentageDayEntry {
  return {
    trials: Array.from({ length: numberOfTrials }, () => ({ result: null })),
    numberOfTrials,
    initials: "",
    environmentalNote: "",
  }
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function countYes(entry: PercentageDayEntry): number {
  return entry.trials.filter((t) => t.result === "yes").length
}

export function countNo(entry: PercentageDayEntry): number {
  return entry.trials.filter((t) => t.result === "no").length
}

export function countAnswered(entry: PercentageDayEntry): number {
  return entry.trials.filter((t) => t.result !== null).length
}

export function calculatePercentage(entry: PercentageDayEntry): number | null {
  const answered = countAnswered(entry)
  if (answered === 0) return null
  return Math.round((countYes(entry) / entry.numberOfTrials) * 100)
}

export function cycleTrialResult(current: TrialResult): TrialResult {
  if (current === null) return "yes"
  if (current === "yes") return "no"
  return null
}
