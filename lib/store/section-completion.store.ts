import { create } from "zustand"
import type { SectionCompletionMap } from "@/lib/types/section-completion.types"
import { getSectionCompletion } from "@/lib/modules/section-completion/services/section-completion.service"

const CACHE_DURATION_MS = 5 * 60 * 1000

interface SectionCompletionState {
  completionMap: SectionCompletionMap
  isLoading: boolean
  error: Error | null
  lastFetchedAt: number | null

  fetchCompletion: () => Promise<void>
  invalidate: () => void
  isSectionComplete: (key: string) => boolean
  getMissingCount: (childKeys: string[]) => { complete: number; total: number; missing: number }
}

export const useSectionCompletionStore = create<SectionCompletionState>((set, get) => ({
  completionMap: {},
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  fetchCompletion: async () => {
    const { lastFetchedAt, isLoading } = get()

    if (isLoading) return

    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_DURATION_MS) return

    try {
      set({ isLoading: true, error: null })
      const data = await getSectionCompletion()
      set({ completionMap: data, lastFetchedAt: Date.now() })
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch section completion")
      set({ error })
    } finally {
      set({ isLoading: false })
    }
  },

  invalidate: () => {
    set({ lastFetchedAt: null })
    get().fetchCompletion()
  },

  isSectionComplete: (key: string) => {
    const { completionMap } = get()
    return completionMap[key] !== false
  },

  getMissingCount: (childKeys: string[]) => {
    const { completionMap } = get()
    let complete = 0
    let missing = 0

    for (const key of childKeys) {
      if (completionMap[key] === false) {
        missing++
      } else {
        complete++
      }
    }

    return { complete, total: childKeys.length, missing }
  },
}))
