import type React from "react"

import { redirect } from "next/navigation"
import { useUi } from "@/lib/store/ui.store"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { cookies } from "next/headers"

export default async function AppLayout({ children }: { children: React.ReactNode }) {

  const cookieStore = await cookies()
  const token = cookieStore.get("mv_fo_token")?.value

  if (!token) {
    redirect("/login")
  }


  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn("transition-all duration-300 ml-[280px]")}>
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
