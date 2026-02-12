"use client"

export function CredentialsSignatureSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-3 w-72 rounded bg-slate-100" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-20 w-full rounded bg-slate-100" />
        </div>
      </div>
    </div>
  )
}
