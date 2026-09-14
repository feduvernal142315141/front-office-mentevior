"use client"

import { type ReactNode, useState } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ConfigurationSection {
  id: string
  title: string
  icon: ReactNode
  disabled?: boolean
}

interface ConfigurationSidebarProps {
  sections: ConfigurationSection[]
  activeSectionId: string
  onSectionClick: (id: string) => void
}

export function ConfigurationSidebar({
  sections,
  activeSectionId,
  onSectionClick,
}: ConfigurationSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "shrink-0 bg-white border-r border-slate-200/60 py-4 pb-36 custom-scrollbar overflow-y-auto transition-all duration-300",
        collapsed ? "w-[68px] px-3" : "w-72 pl-8 pr-5",
      )}
    >
      {/* Header */}
      <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent">
              Configuration
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage service plan and data collection</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600",
            collapsed && "mt-1",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className="space-y-2 pb-8">
        {sections.map((section) => {
          const isActive = section.id === activeSectionId
          const isDisabled = section.disabled

          return (
            <div key={section.id} className="relative">
              <button
                type="button"
                onClick={() => !isDisabled && onSectionClick(section.id)}
                disabled={isDisabled}
                title={collapsed ? section.title : undefined}
                className={cn(
                  "relative w-full flex items-center gap-4 rounded-xl transition-all duration-300",
                  "group",
                  collapsed ? "justify-center p-2.5" : "p-3",
                  isActive &&
                    "bg-gradient-to-br from-[#037ECC]/5 to-[#079CFB]/5 border border-[#037ECC]/20 shadow-sm",
                  !isActive && !isDisabled && "hover:bg-slate-50/80",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    "border-2",
                    isActive &&
                      "border-[#037ECC] bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10",
                    !isActive && !isDisabled && "border-slate-300 bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "[&>svg]:w-4 [&>svg]:h-4 transition-colors",
                      isActive ? "text-[#037ECC]" : "text-slate-500"
                    )}
                  >
                    {section.icon}
                  </span>
                </div>

                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <h3
                      className={cn(
                        "text-sm font-semibold transition-colors truncate",
                        isActive && "text-[#037ECC]",
                        !isActive && "text-slate-700"
                      )}
                    >
                      {section.title}
                    </h3>
                  </div>
                )}

                {isActive && !collapsed && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#037ECC] to-[#079CFB] rounded-full" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
