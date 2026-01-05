"use client"

import { CalendarClock } from "lucide-react"

export default function TemplateMonthlySupervisionPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <CalendarClock className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Monthly Supervision Template
            </h1>
            <p className="text-slate-600 mt-1">Manage monthly supervision templates</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
              <CalendarClock className="h-12 w-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Coming Soon</h2>
            <p className="text-slate-600">
              This module is currently under development. Check back soon for updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
