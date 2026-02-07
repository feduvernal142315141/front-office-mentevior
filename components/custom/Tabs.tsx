"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
  badge?: string | number
}

interface TabsProps {
  items: TabItem[]
  defaultTab?: string
  className?: string
  onChange?: (tabId: string) => void
}

export function Tabs({
  items,
  defaultTab,
  className,
  onChange,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative border-b border-slate-200">
        <div
          className="flex items-center gap-4 select-none px-6"
          role="tablist"
          aria-orientation="horizontal"
        >
          {items.map((item) => {
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "relative h-16 px-3 text-[15px] font-semibold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-2",
                  isActive
                    ? "text-[#037ECC]"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {item.icon && (
                  <span
                    className={cn(
                      "flex-shrink-0 transition-opacity duration-300",
                      isActive ? "opacity-100" : "opacity-60"
                    )}
                  >
                    {item.icon}
                  </span>
                )}

                <span>{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums transition-colors",
                      isActive ? "bg-[#037ECC]/10 text-[#037ECC]" : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <span
                    className="absolute inset-x-0 -bottom-[1px] h-[4px] rounded-full bg-gradient-to-r from-[#037ECC] to-[#079CFB] shadow-[0_4px_12px_rgba(3,126,204,0.5)] animate-in slide-in-from-bottom-1 duration-300"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative">
        {items.map((item) => (
          <div
            key={item.id}
            id={`panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={item.id}
            hidden={activeTab !== item.id}
            className="px-6 py-6 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  )
}
