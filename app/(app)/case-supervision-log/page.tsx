"use client"

import { ClipboardCheck } from "lucide-react"
import { CaseSupervisionLogTable } from "./components/CaseSupervisionLogTable"

export default function CaseSupervisionLogPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl border border-[#037ECC]/20 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 p-3">
            <ClipboardCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-3xl font-bold text-transparent">
              Case Supervision Log
            </h1>
            <p className="mt-1 text-slate-600">
              Monthly supervision coverage per client and supervisor
            </p>
          </div>
        </div>

        <CaseSupervisionLogTable />
      </div>
    </div>
  )
}
