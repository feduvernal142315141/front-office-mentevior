"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export interface ChartTab {
  id: string
  label: string
  disabled?: boolean
  disabledHint?: string
  hasError?: boolean
}

interface ChartTabsProps {
  tabs: ChartTab[]
  activeId: string
  onChange: (id: string) => void
}

const SCROLL_STEP = 160

export function ChartTabs({ tabs, activeId, onChange }: ChartTabsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateOverflowState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 1)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  useLayoutEffect(() => {
    updateOverflowState()
  }, [tabs, updateOverflowState])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    updateOverflowState()

    const observer = new ResizeObserver(updateOverflowState)
    observer.observe(el)

    el.addEventListener("scroll", updateOverflowState, { passive: true })
    window.addEventListener("resize", updateOverflowState)

    return () => {
      observer.disconnect()
      el.removeEventListener("scroll", updateOverflowState)
      window.removeEventListener("resize", updateOverflowState)
    }
  }, [updateOverflowState])

  useEffect(() => {
    const node = tabRefs.current.get(activeId)
    const scroller = scrollerRef.current
    if (!node || !scroller) return

    const nodeLeft = node.offsetLeft
    const nodeRight = nodeLeft + node.offsetWidth
    const viewLeft = scroller.scrollLeft
    const viewRight = viewLeft + scroller.clientWidth

    if (nodeLeft < viewLeft) {
      scroller.scrollTo({ left: nodeLeft - 16, behavior: "smooth" })
    } else if (nodeRight > viewRight) {
      scroller.scrollTo({
        left: nodeRight - scroller.clientWidth + 16,
        behavior: "smooth",
      })
    }
  }, [activeId])

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className={cn(
          "flex items-center gap-1 overflow-x-auto scroll-smooth rounded-2xl",
          "bg-slate-100/70 p-1 ring-1 ring-slate-200/60",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.id, node)
                else tabRefs.current.delete(tab.id)
              }}
              type="button"
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              title={tab.disabled ? tab.disabledHint : undefined}
              className={cn(
                "relative shrink-0 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40",
                isActive &&
                  "bg-white text-[#037ECC] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.08)]",
                !isActive &&
                  !tab.disabled &&
                  "text-slate-500 hover:text-slate-700 hover:bg-white/60",
                tab.disabled && "cursor-not-allowed text-slate-300",
                tab.hasError && !isActive && "text-red-600 ring-1 ring-red-200"
              )}
            >
              {tab.label}
              {tab.hasError && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500"
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-y-1 left-1 w-10 rounded-l-xl bg-gradient-to-r from-slate-100/95 via-slate-100/70 to-transparent transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-1 right-1 w-10 rounded-r-xl bg-gradient-to-l from-slate-100/95 via-slate-100/70 to-transparent transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />

      <button
        type="button"
        onClick={() => scrollBy(-SCROLL_STEP)}
        aria-label="Scroll tabs left"
        className={cn(
          "absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full",
          "bg-white text-slate-600 ring-1 ring-slate-200 shadow-sm",
          "hover:text-[#037ECC] hover:ring-[#037ECC]/30 transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40",
          canScrollLeft
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(SCROLL_STEP)}
        aria-label="Scroll tabs right"
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full",
          "bg-white text-slate-600 ring-1 ring-slate-200 shadow-sm",
          "hover:text-[#037ECC] hover:ring-[#037ECC]/30 transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#037ECC]/40",
          canScrollRight
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
