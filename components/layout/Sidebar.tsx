"use client"

import { usePathname } from 'next/navigation'
import Link from "next/link"
import { motion } from "framer-motion"
import { Gauge, Calendar, Users, UserCog, BarChart3, Settings, Shield, ChevronLeft, ChevronRight, Activity } from 'lucide-react'
import { useSession } from "@/lib/store/session.store"
import { useUi } from "@/lib/store/ui.store"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, any> = {
  Gauge,
  Calendar,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Shield,
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useSession()
  const { sidebarCollapsed, toggleSidebar } = useUi()

  if (!user) return null


  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen sidebar-premium flex flex-col z-40"
    >
      <div
        className={cn("flex items-center pt-8 pb-6", sidebarCollapsed ? "flex-col gap-3 px-3" : "justify-between px-5")}
      >
        {sidebarCollapsed ? (
          <>
            <Link href="/dashboard">
              <div className="sidebar-logo flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </Link>

            <button
              onClick={toggleSidebar}
              className="sidebar-collapse-btn flex items-center justify-center"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </>
        ) : (
          <>
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="sidebar-logo flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent whitespace-nowrap">
                MenteVior
              </span>
            </Link>

            <button
              onClick={toggleSidebar}
              className="sidebar-collapse-btn flex items-center justify-center flex-shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </>
        )}
      </div>

      <nav className={cn("flex-1", sidebarCollapsed ? "px-3 overflow-visible" : "px-5 overflow-y-auto")}>
        <div className={cn("flex flex-col gap-6", sidebarCollapsed ? "items-center" : "")}>
          {navigation.map((item) => {
            const Icon = ICON_MAP[item.icon]
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("w-full", sidebarCollapsed ? "flex justify-center" : "")}
              >
                <motion.div
                  whileHover={{ scale: sidebarCollapsed ? 1.02 : 1 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  {sidebarCollapsed ? (
                    <div className={cn("sidebar-nav-item sidebar-item-hover", isActive && "sidebar-item-active")}>
                      {Icon && (
                        <Icon
                          className={cn("h-6 w-6", isActive ? "text-white" : "text-[#334155] dark:text-[#9BB0C3]")}
                        />
                      )}
                      <span className="sidebar-tooltip pointer-events-none">{item.label}</span>
                    </div>
                  ) : (
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 h-12 px-4 rounded-xl font-medium text-[15px]",
                        "sidebar-item-hover transition-all duration-150",
                        isActive && "sidebar-item-active",
                        !isActive && "text-[#334155] dark:text-[#9BB0C3]",
                      )}
                    >
                      {Icon && (
                        <motion.div
                          animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className={cn("h-6 w-6", isActive && "text-white")} />
                        </motion.div>
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="sidebar-separator" />

      <div className={cn("pb-8 flex", sidebarCollapsed ? "px-3 justify-center" : "px-5")}>
        <Link href="/settings">
          <div className="sidebar-avatar">
            <span className="text-sm font-bold text-primary">{user.name.charAt(0)}</span>
          </div>
        </Link>
      </div>
    </motion.aside>
  )
}
