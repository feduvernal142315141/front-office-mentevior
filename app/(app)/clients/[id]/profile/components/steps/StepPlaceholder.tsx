"use client"

import { LucideIcon } from "lucide-react"

interface StepPlaceholderProps {
  icon: LucideIcon
  title: string
  scrumId: string
}

export function StepPlaceholder({ icon: Icon, title, scrumId }: StepPlaceholderProps) {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 mb-6">
          <Icon className="w-16 h-16 text-slate-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-700 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm">Coming soon - {scrumId}</p>
      </div>
    </div>
  )
}
