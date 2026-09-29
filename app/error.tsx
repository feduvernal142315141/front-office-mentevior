"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="text-lg font-semibold text-slate-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          An unexpected error occurred. Your work is safe — click below to
          recover without refreshing the page.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#037ECC] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#025fa0] active:scale-[0.97]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>

        {error.digest && (
          <p className="mt-4 text-[11px] tabular-nums text-slate-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
