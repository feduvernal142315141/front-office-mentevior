"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { NotebookPen, CalendarCheck, ChevronLeft, ChevronRight, Gauge, Users, Hospital, CalendarClock, ClipboardList, ClipboardCheck, TrendingUp, User, UserCog, Shield, Building2, BarChart3, FileSignature, FileText, FolderHeart, FolderOpen, FileCheck, UserPlus, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useUi } from "@/lib/store/ui.store"
import { cn } from "@/lib/utils"
import { useFilteredNavItems } from "@/lib/hooks/use-filtered-nav-items"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export const ICON_MAP = {
  Gauge,
  Users,
  CalendarCheck,
  NotebookPen,
  Hospital,
  CalendarClock,
  ClipboardList,
  ClipboardCheck,
  TrendingUp,
  User,
  UserCog,
  Shield,
  Building2,
  BarChart3,
  FileSignature,
  FileText,
  FolderHeart,
  FolderOpen,
  FileCheck,
  UserPlus,
} as const

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUi()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const filteredNavItems = useFilteredNavItems()

  const isMobile = useMediaQuery("(max-width: 1024px)")

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) => {
      const isCurrentlyExpanded = prev[href]
      
      if (isCurrentlyExpanded) {
        return {
          ...prev,
          [href]: false,
        }
      }
      
      const newState: Record<string, boolean> = {}
      Object.keys(prev).forEach(key => {
        newState[key] = false
      })
      newState[href] = true
      
      return newState
    })
  }

  const collapseAll = () => {
    setExpandedItems({})
  }

  useEffect(() => {
    let itemToExpand: string | null = null
    
    filteredNavItems.forEach((item) => {
      if (item.children) {
        const isCurrentOrChild = pathname === item.href || item.children.some((child) => pathname === child.href)
        if (isCurrentOrChild) {
          itemToExpand = item.href
        }
      }
    })
    
    if (itemToExpand && !expandedItems[itemToExpand]) {
      setExpandedItems({ [itemToExpand]: true })
    }

    else if (!itemToExpand && Object.keys(expandedItems).length > 0) {
      setExpandedItems({})
    }
  }, [pathname, filteredNavItems])

  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      toggleSidebar()
    }

    if (!isMobile && sidebarCollapsed) {
      toggleSidebar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 80 
      : 280, }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="
        fixed left-0 top-0 z-40 h-screen
        bg-white
        border-r border-border/30
        backdrop-blur-xl
        flex flex-col
        shadow-[0_8px_30px_rgb(0,0,0,0.04)]
      "
    >
      <div className={`relative h-16 flex border-b border-border/20 ${sidebarCollapsed ? "items-center justify-center" : "px-6"}`}>
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden group">
          <div
            className={cn(
              "flex shrink-0 transition-all duration-300",
              sidebarCollapsed ? "h-14 w-14" : "h-16 w-16",
            )}
          >
            <Image
              src="/logoMenteVior.png"
              alt="MenteVior"
              width={sidebarCollapsed ? 56 : 64}
              height={sidebarCollapsed ? 56 : 64}
              priority
              className="object-contain transition-all duration-300 group-hover:scale-110 drop-shadow-[0_4px_12px_rgba(3,126,204,0.25)]"
            />
          </div>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <span
                  className="
                  font-bold text-2xl tracking-tight
                  bg-gradient-to-r from-[#037ECC] via-[#079CFB] to-[#037ECC]
                  bg-clip-text text-transparent
                  whitespace-nowrap
                  animate-gradient
                  bg-[length:200%_auto]
                "
                >
                  MenteVior
                </span>
                
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={toggleSidebar}
          className="
            absolute -right-3 top-1/2 -translate-y-1/2
            h-7 w-7 rounded-full
            flex items-center justify-center
            bg-gradient-to-br from-white to-slate-50
            border border-border/50
            shadow-[0_2px_8px_rgba(0,0,0,0.08)]
            hover:shadow-[0_4px_12px_rgba(3,126,204,0.2)]
            hover:border-[#037ECC]/50
            transition-all duration-200
            group/btn
            z-[60]
          "
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/btn:text-[#037ECC] transition-colors" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover/btn:text-[#037ECC] transition-colors" />
          )}
        </button>
      </div>

      <nav className={cn("flex-1 pt-8 overflow-y-auto", sidebarCollapsed ? "px-3" : "px-5")}>
        <div className="flex flex-col gap-2">
          {filteredNavItems.map((item) => {
            const Icon = ICON_MAP[item.icon]
            const isActive = pathname === item.href
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems[item.href]
            const isChildActive = hasChildren && item.children?.some((child) => pathname === child.href)

            if (!Icon) return null

            return (
              <div key={item.href} className="relative">
                <div
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="relative"
                >
                  {hasChildren ? (
                    <Link 
                      href={item.href}
                      onClick={() => {
                        setExpandedItems({ [item.href]: true })
                      }}
                    >
                      <motion.div
                        layout
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "relative h-12 rounded-xl flex items-center gap-4 transition-all duration-200",
                          sidebarCollapsed ? "justify-center px-2" : "px-4",
                          isActive || isChildActive
                            ? "bg-gradient-to-r from-[#037ECC] to-[#079CFB] text-white shadow-[0_8px_24px_rgba(3,126,204,0.4)]"
                            : "text-slate-600 hover:bg-slate-50 hover:shadow-sm",
                        )}
                      >
                        {(isActive || isChildActive) && !sidebarCollapsed && (
                          <motion.span
                            layoutId="sidebar-rail"
                            className="
                              absolute left-0 top-1/2 -translate-y-1/2
                              h-8 w-1 rounded-r-full bg-white/90
                              shadow-[0_0_8px_rgba(255,255,255,0.5)]
                            "
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}

                        <Icon className={cn("shrink-0 transition-all", sidebarCollapsed ? "h-6 w-6" : "h-5 w-5")} />

                        <AnimatePresence>
                          {!sidebarCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              transition={{ duration: 0.15 }}
                              className="text-sm font-semibold tracking-wide flex-1 text-left"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {!sidebarCollapsed && hasChildren && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleExpanded(item.href)
                            }}
                            className="z-10 p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </motion.div>
                          </button>
                        )}

                        {(isActive || isChildActive) && sidebarCollapsed && (
                          <motion.span
                            layoutId="sidebar-dot"
                            className="
                              absolute bottom-1 left-1/2 -translate-x-1/2
                              h-1 w-1 rounded-full bg-white
                              shadow-[0_0_4px_rgba(255,255,255,0.8)]
                            "
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  ) : (
                    <Link href={item.href} onClick={collapseAll}>
                      <motion.div
                        layout
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "relative h-12 rounded-xl flex items-center gap-4 transition-all duration-200",
                          sidebarCollapsed ? "justify-center px-2" : "px-4",
                          isActive
                            ? "bg-gradient-to-r from-[#037ECC] to-[#079CFB] text-white shadow-[0_8px_24px_rgba(3,126,204,0.4)]"
                            : "text-slate-600 hover:bg-slate-50 hover:shadow-sm",
                        )}
                      >
                        {isActive && !sidebarCollapsed && (
                          <motion.span
                            layoutId="sidebar-rail"
                            className="
                              absolute left-0 top-1/2 -translate-y-1/2
                              h-8 w-1 rounded-r-full bg-white/90
                              shadow-[0_0_8px_rgba(255,255,255,0.5)]
                            "
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}

                        <Icon className={cn("shrink-0 transition-all", sidebarCollapsed ? "h-6 w-6" : "h-5 w-5")} />

                        <AnimatePresence>
                          {!sidebarCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              transition={{ duration: 0.15 }}
                              className="text-sm font-semibold tracking-wide"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {isActive && sidebarCollapsed && (
                          <motion.span
                            layoutId="sidebar-dot"
                            className="
                              absolute bottom-1 left-1/2 -translate-x-1/2
                              h-1 w-1 rounded-full bg-white
                              shadow-[0_0_4px_rgba(255,255,255,0.8)]
                            "
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  )}

                  <AnimatePresence>
                    {sidebarCollapsed && hoveredItem === item.href && (
                      <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="
                          absolute left-[72px] top-1/2 -translate-y-1/2
                          px-3 py-2 rounded-lg
                          bg-slate-900
                          text-white text-sm font-medium
                          shadow-[0_8px_24px_rgba(0,0,0,0.3)]
                          border border-white/10
                          whitespace-nowrap
                          pointer-events-none
                          z-50
                          backdrop-blur-sm
                        "
                        style={{
                          boxShadow: "0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)",
                        }}
                      >
                        {item.label}
           
                        <div
                          className="
                            absolute right-full top-1/2 -translate-y-1/2
                            w-0 h-0
                            border-t-[6px] border-t-transparent
                            border-r-[6px] border-r-slate-900
                            border-b-[6px] border-b-transparent
                          "
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {hasChildren && isExpanded && !sidebarCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 mt-1 ml-4 pl-4 border-l-2 border-slate-200">
                        {item.children?.map((child) => {
                          const isChildItemActive = pathname === child.href

                          return (
                            <Link key={child.href} href={child.href}>
                              <motion.div
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                  "h-9 px-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-xs font-medium",
                                  isChildItemActive
                                    ? "bg-[#037ECC]/10 text-[#037ECC] border-l-2 border-[#037ECC]"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-[#037ECC]",
                                )}
                              >
                                <span>{child.label}</span>
                              </motion.div>
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </nav>      
    </motion.aside>
  )
}
