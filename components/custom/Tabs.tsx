"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const activeItem = items.find((item) => item.id === activeTab) ?? items[0]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const checkScroll = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    
    setShowLeftArrow(scrollLeft > 5)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5)
  }

  useEffect(() => {
    checkScroll()

    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(container)

    container.addEventListener('scroll', checkScroll)

    return () => {
      resizeObserver.disconnect()
      container.removeEventListener('scroll', checkScroll)
    }
  }, [items])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 300
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
    
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  return (
    <div className={cn("w-full", className)}>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="relative">
        <div className="relative border-b border-slate-200">
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-4 select-none overflow-x-auto scrollbar-hide scroll-smooth px-16"
            role="tablist"
            aria-orientation="horizontal"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
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
                    "relative h-16 px-3 text-[15px] font-semibold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center gap-2 flex-shrink-0",
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

        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center bg-gradient-to-r from-gray-50 via-gray-50 to-transparent pl-1 pr-6">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!showLeftArrow}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-md transition-all",
              showLeftArrow 
                ? "hover:bg-slate-50 hover:border-slate-300 cursor-pointer" 
                : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center bg-gradient-to-l from-gray-50 via-gray-50 to-transparent pr-1 pl-6">
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!showRightArrow}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 shadow-md transition-all",
              showRightArrow 
                ? "hover:bg-slate-50 hover:border-slate-300 cursor-pointer" 
                : "opacity-40 cursor-not-allowed"
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {activeItem && (
        <div
          id={`panel-${activeItem.id}`}
          role="tabpanel"
          aria-labelledby={activeItem.id}
          className="relative px-6 py-6 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  )
}
