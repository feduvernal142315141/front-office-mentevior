"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export function SignatureScrollIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const container = document.getElementById("main-scroll")
    if (!container) return

    function onScroll() {
      setVisible(container!.scrollTop < 400)
    }

    container.addEventListener("scroll", onScroll, { passive: true })
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="sticky bottom-0 w-full flex justify-center pb-4 pointer-events-none" style={{ zIndex: 50 }}>
      <button
        onClick={() => {
          const container = document.getElementById("main-scroll")
          if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
        }}
        className="pointer-events-auto animate-indicator-bounce group px-4 py-2 rounded-full bg-blue-50 backdrop-blur-md text-blue-600 text-xs font-medium border border-blue-200 shadow-md hover:shadow-lg hover:border-blue-300 hover:bg-blue-100 transition-all duration-300"
      >
        <span className="flex items-center gap-1.5">
          Signature Below
          <ChevronDown className="w-3.5 h-3.5 animate-chevron-bounce" />
        </span>
      </button>
    </div>
  )
}
