"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useSectionCompletionStore } from "@/lib/store/section-completion.store"

const CONFIG_PATH_PREFIXES = [
  "/my-company",
  "/agreements",
  "/applicants",
  "/data-collection",
]

function isCompanyConfigPath(path: string): boolean {
  return CONFIG_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Keeps sidebar completion badges in sync with the backend.
 *
 * Refetches when the user enters, leaves, or switches between company-config
 * routes — covers the common "save and navigate" flow without hitting the API
 * on every unrelated page change.
 */
export function SectionCompletionSync() {
  const pathname = usePathname()
  const fetchCompletion = useSectionCompletionStore((s) => s.fetchCompletion)
  const previousPathRef = useRef<string | null>(null)

  useEffect(() => {
    const previousPath = previousPathRef.current
    previousPathRef.current = pathname

    if (previousPath === null) return

    const enteredConfig = isCompanyConfigPath(pathname)
    const leftConfig = isCompanyConfigPath(previousPath) && !enteredConfig
    const switchedConfig =
      isCompanyConfigPath(previousPath) &&
      isCompanyConfigPath(pathname) &&
      previousPath !== pathname

    if (enteredConfig || leftConfig || switchedConfig) {
      void fetchCompletion({ force: true })
    }
  }, [pathname, fetchCompletion])

  return null
}
