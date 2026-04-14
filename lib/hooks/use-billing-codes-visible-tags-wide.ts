"use client"

import { useState, useEffect } from "react"

/**
 * Returns the right maxVisibleTags for billing codes MultiSelect
 * in wide-field contexts (col-span-3: Service Plan / Supervision).
 *
 * Each tramo is +1 vs the standard hook, max 7 at 2xl.
 *
 *   >= 1536 → 7 tags  (2xl)
 *   >= 1400 → 5 tags
 *   >= 1207 → 4 tags
 *   >=  900 → 3 tags
 *          → 2 tags
 */
export function useBillingCodesVisibleTagsWide(): number {
  const getCount = () => {
    const w = window.innerWidth
    if (w >= 1536) return 7
    if (w >= 1400) return 5
    if (w >= 1207) return 4
    if (w >= 900)  return 3
    return 2
  }

  const [count, setCount] = useState<number>(getCount)

  useEffect(() => {
    const handler = () => setCount(getCount())
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  return count
}
