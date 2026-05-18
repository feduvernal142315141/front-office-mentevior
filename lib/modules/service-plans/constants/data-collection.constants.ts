import type { LevelsLibraryGroup } from "@/lib/types/data-collection.types"

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
  { value: "days", label: "Days" },
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
// These receive the resolved `name` or `group` from the catalog, not the UUID.

export function typeRequiresWeeklyDaily(typeName: string): boolean {
  return typeName === "Frequency" || typeName === "Rate"
}

export function typeRequiresUnitOfTime(typeName: string): boolean {
  return typeName === "Rate"
}

export function typeRequiresInterval(typeGroup: string): boolean {
  return typeGroup === "Time-sampling"
}

export function typeHasCumulativeValueToggles(typeGroup: string): boolean {
  return typeGroup === "Time-sampling"
}

export function typeHasLevels(typeId: string): boolean {
  return typeId !== ""
}
