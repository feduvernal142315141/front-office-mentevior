"use client"

import { CalendarCheck } from "lucide-react"
import { WeekCalendar } from "./components"


export default function SchedulesPage() {

  const currentRbtId = "rbt-001"
  
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
  
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20">
            <CalendarCheck className="h-8 w-8 text-[#037ECC]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Schedules
            </h1>
            <p className="text-slate-600 mt-0.5 text-sm md:text-base">
              Manage your appointments and sessions
            </p>
          </div>
        </div>

     
        <WeekCalendar rbtId={currentRbtId} />
      </div>
    </div>
  )
}
