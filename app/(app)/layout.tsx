"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/store/session.store"
import { useUi } from "@/lib/store/ui.store"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { cn } from "@/lib/utils"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSession()
  const { darkMode, sidebarCollapsed } = useUi()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "ml-20" : "ml-[280px]")}>
        <Topbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
