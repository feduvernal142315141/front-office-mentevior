import { useSectionCompletionStore } from "@/lib/store/section-completion.store"

/** Clears cache and refetches `/company/setup-status` — call after saving company config. */
export function invalidateSectionCompletion() {
  useSectionCompletionStore.getState().invalidate()
}

/** Forces a fresh fetch without clearing other store state. */
export function refreshSectionCompletion() {
  void useSectionCompletionStore.getState().fetchCompletion({ force: true })
}
