"use client"

import { cn } from "@/lib/utils"

export interface ChartTab {
  id: string
  label: string
  disabled?: boolean
  disabledHint?: string
}

interface ChartTabsProps {
  tabs: ChartTab[]
  activeId: string
  onChange: (id: string) => void
}

export function ChartTabs({ tabs, activeId, onChange }: ChartTabsProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          "flex items-center gap-1 overflow-x-auto rounded-2xl",
          "bg-slate-100/70 p-1 ring-1 ring-slate-200/60",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              title={tab.disabled ? tab.disabledHint : undefined}
              className={cn(
                "relative shrink-0 rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40",
                isActive &&
                  "bg-white text-[#037ECC] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.08)]",
                !isActive &&
                  !tab.disabled &&
                  "text-slate-500 hover:text-slate-700 hover:bg-white/60",
                tab.disabled && "cursor-not-allowed text-slate-300"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
