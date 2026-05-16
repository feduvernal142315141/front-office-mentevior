import type { LevelsLibraryGroup } from "@/lib/types/data-collection.types"

// Grouped Type catalog
export const DATA_COLLECTION_TYPE_GROUPS = [
  {
    group: "Event-recording",
    options: [
      { value: "frequency", label: "Frequency" },
      { value: "count", label: "Count" },
      { value: "rate", label: "Rate" },
    ],
  },
  {
    group: "Time-sampling",
    options: [
      { value: "whole-interval", label: "Whole Interval" },
      { value: "partial-interval", label: "Partial Interval" },
      { value: "momentary-time-sampling", label: "Momentary Time Sampling" },
    ],
  },
  {
    group: "Timing",
    options: [
      { value: "duration", label: "Duration" },
      { value: "response-latency", label: "Response Latency" },
      { value: "interresponse-time", label: "Interresponse Time" },
    ],
  },
  {
    group: "Trial",
    options: [
      { value: "discrete-trial-teaching", label: "Discrete Trial Teaching" },
      { value: "incident-teaching", label: "Incident Teaching" },
      { value: "percentage-of-opportunities", label: "Percentage of Opportunities" },
    ],
  },
  {
    group: "Task-analysis",
    options: [
      { value: "forward-chaining", label: "Forward Chaining" },
      { value: "total-task-chaining", label: "Total Task Chaining" },
      { value: "backward-chaining", label: "Backward Chaining" },
      { value: "backward-chaining-with-leaps-ahead", label: "Backward Chaining with Leaps Ahead" },
    ],
  },
  {
    group: "Log",
    options: [
      { value: "measurement-log", label: "Measurement Log" },
    ],
  },
] as const

// Weekly/Daily Value options
export const WEEKLY_DAILY_OPTIONS = [
  { value: "total", label: "Total" },
  { value: "average", label: "Average" },
]

// Unit of Time options
export const UNIT_OF_TIME_OPTIONS = [
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
]

// Levels Library data
export const LEVELS_LIBRARY: LevelsLibraryGroup[] = [
  {
    id: "levels-of-prompts",
    name: "Levels of Prompts",
    items: [
      { id: "nr", name: "No Response", abbreviation: "NR" },
      { id: "pp", name: "Physical Prompt", abbreviation: "PP" },
      { id: "mp", name: "Modeling Prompt", abbreviation: "MP" },
      { id: "gp", name: "Gestural Prompt", abbreviation: "GP" },
      { id: "vp", name: "Verbal Prompt", abbreviation: "VP" },
      { id: "visp", name: "Visual Prompt", abbreviation: "VP" },
      { id: "po", name: "Positional Prompt", abbreviation: "PO" },
      { id: "i", name: "Independent", abbreviation: "I" },
    ],
  },
  {
    id: "levels-of-response",
    name: "Levels of Response",
    items: [
      { id: "nc", name: "Non-compliance", abbreviation: "NC" },
      { id: "ur", name: "Unsuccessful response", abbreviation: "-" },
      { id: "sr", name: "Successful response", abbreviation: "+" },
    ],
  },
  {
    id: "levels-of-intensity",
    name: "Levels of Intensity",
    items: [
      { id: "mild", name: "Mild", abbreviation: "1" },
      { id: "moderate", name: "Moderate", abbreviation: "2" },
      { id: "severe", name: "Severe", abbreviation: "3" },
      { id: "extreme", name: "Extreme", abbreviation: "4" },
    ],
  },
]

// --- Helper functions: which fields are shown per type ---

export function typeRequiresWeeklyDaily(type: string): boolean {
  return ["frequency"].includes(type)
}

export function typeRequiresInterval(type: string): boolean {
  return ["whole-interval", "partial-interval", "momentary-time-sampling"].includes(type)
}

export function typeHasCumulativeValueToggles(type: string): boolean {
  return ["whole-interval", "partial-interval", "momentary-time-sampling"].includes(type)
}

export function typeHasLevels(type: string): boolean {
  return type !== ""
}

// Resolve display label for a type value
export function getTypeLabel(typeValue: string): string {
  for (const group of DATA_COLLECTION_TYPE_GROUPS) {
    const found = group.options.find((o) => o.value === typeValue)
    if (found) return found.label
  }
  return typeValue
}
