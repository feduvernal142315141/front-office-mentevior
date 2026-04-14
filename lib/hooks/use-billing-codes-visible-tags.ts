"use client"

import { useState, useEffect } from "react"

/**
 * Returns the right maxVisibleTags for the billing codes MultiSelect
 * based on the available viewport width.
 *
 * The field occupies md:col-span-2 of a 4-col grid, so its effective
 * width scales with the viewport minus the sidebar (~220px).
 *
 * Breakpoints (viewport):
 *   >= 1400 → 4 tags
 *   >= 1100 → 3 tags
 *   >=  900 → 2 tags
 *          → 1 tag
 */
export function useBillingCodesVisibleTags(): number {
  const getCount = () => {
    const w = window.innerWidth
    if (w >= 1400) return 4
    if (w >= 1207) return 3
    if (w >= 1207)  return 2
    return 1
  }

  const [count, setCount] = useState<number>(getCount)

  useEffect(() => {
    const handler = () => setCount(getCount())
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  return count
}
