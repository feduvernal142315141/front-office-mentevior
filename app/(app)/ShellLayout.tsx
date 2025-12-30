"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { cn } from "@/lib/utils"
import { useUi } from "@/lib/store/ui.store"

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const { sidebarCollapsed } = useUi()

  return (
    <div className="h-screen bg-background overflow-hidden">
      <Sidebar />

      <div
        className={cn(
          "flex flex-col h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarCollapsed ? "ml-20" : "ml-[280px]"
        )}
      >
        <Topbar />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
