import { getDateKey, parseLocalDate } from "./datasheet-utils"

/**
 * Which calendar days the CHART must skip.
 *
 * Days that carry data are the ones that matter: every empty day BEFORE the last datapoint is
 * collapsed, in every window size. An empty day sitting between two real values adds a dead
 * column and breaks the line (e.g. baselines on 07/15 and 07/17 would be drawn apart with a
 * hole on 07/16); hiding it makes both points adjacent, so the line connects them directly.
 *
 * The tail is kept on purpose: empty days AFTER the last datapoint stay on the axis, so the
 * chart keeps showing the rest of the selected range (the days of the week/month still to be
 * collected) instead of ending abruptly.
 *
 * Never hidden (they must keep a slot on the axis):
 * - baseline dates, even when empty
 * - objective (STO) start/end dates, because the "Treatment" and STO reference lines are
 *   positioned by axis category — hiding those days would make the markers disappear
 *
 * NOTE: this is a render-only filter. Aggregation (weekly/monthly) and the range totals must
 * keep using the full set of days, otherwise the numbers would be wrong.
 */

interface BaselineLike {
  date?: string
  value?: number
  show?: boolean
}

interface ObjectiveLike {
  startDate?: string
  endDate?: string | null
}

interface ComputeHiddenDayKeysParams {
  /** Full range currently displayed by the chart. */
  chartDays: Date[]
  /** Whether a given "YYYY-MM-DD" key holds a real datapoint. */
  hasData: (dateKey: string) => boolean
  baselines?: BaselineLike[] | null
  objectives?: ObjectiveLike[] | null
}

export function computeHiddenDayKeys({
  chartDays,
  hasData,
  baselines,
  objectives,
}: ComputeHiddenDayKeysParams): Set<string> {
  // Baseline days are real datapoints: they can't be hidden and they push the "last value" boundary
  const baselineKeys = new Set<string>()
  for (const baseline of baselines ?? []) {
    // Mirrors the chart: only baselines actually drawn keep their slot
    if (!baseline.date || baseline.show === false) continue
    if (baseline.value != null && baseline.value <= 0) continue
    baselineKeys.add(getDateKey(parseLocalDate(baseline.date)))
  }

  // Phase markers can't be hidden either, but an upcoming STO must not extend the boundary
  const markerKeys = new Set<string>()
  for (const objective of objectives ?? []) {
    if (objective.startDate) markerKeys.add(getDateKey(parseLocalDate(objective.startDate)))
    if (objective.endDate) markerKeys.add(getDateKey(parseLocalDate(objective.endDate)))
  }

  // Everything from the last datapoint onwards is kept, so the range tail stays visible
  let lastDataIndex = -1
  chartDays.forEach((day, index) => {
    const key = getDateKey(day)
    if (hasData(key) || baselineKeys.has(key)) lastDataIndex = index
  })

  // Nothing to plot at all: keep the whole range instead of rendering a blank axis
  if (lastDataIndex < 0) return new Set<string>()

  const hidden = new Set<string>()
  chartDays.forEach((day, index) => {
    if (index >= lastDataIndex) return
    const key = getDateKey(day)
    if (baselineKeys.has(key) || markerKeys.has(key)) return
    if (hasData(key)) return
    hidden.add(key)
  })

  return hidden
}
