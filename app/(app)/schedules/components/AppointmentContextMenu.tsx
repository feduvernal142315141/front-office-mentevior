"use client"

import { useEffect, useRef } from "react"
import { Eye, Edit, Copy, XCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"


interface AppointmentContextMenuProps {
  x: number
  y: number
  appointmentId: string
  onAction: (action: string, appointmentId: string) => void
  onClose: () => void
}


const MENU_ITEMS = [
  { action: "view", label: "View details", icon: Eye, danger: false },
  { action: "edit", label: "Edit appointment", icon: Edit, danger: false },
  { action: "duplicate", label: "Duplicate appointment", icon: Copy, danger: false },
  { type: "separator" as const },
  { action: "cancel", label: "Cancel appointment", icon: XCircle, danger: true },
  { action: "delete", label: "Delete appointment", icon: Trash2, danger: true },
]


export function AppointmentContextMenu({
  x,
  y,
  appointmentId,
  onAction,
  onClose,
}: AppointmentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])
  
  const adjustedPosition = {
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 280),
  }
  
  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[100]",
        "min-w-[180px] py-1.5",
        "bg-white rounded-xl",
        "border border-gray-200",
        "shadow-[0_10px_40px_rgba(0,0,0,0.15)]",
        "animate-in fade-in-0 zoom-in-95 duration-150",
      )}
      style={{
        left: `${adjustedPosition.left}px`,
        top: `${adjustedPosition.top}px`,
      }}
    >
      {MENU_ITEMS.map((item, index) => {
        if (item.type === "separator") {
          return (
            <div
              key={`separator-${index}`}
              className="my-1.5 h-px bg-gray-100"
            />
          )
        }
        
        const Icon = item.icon
        
        return (
          <button
            key={item.action}
            type="button"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2",
              "text-sm font-medium text-left",
              "transition-colors duration-150",
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
            )}
            onClick={() => onAction(item.action, appointmentId)}
          >
            <Icon className={cn(
              "h-4 w-4",
              item.danger ? "text-red-500" : "text-gray-400",
            )} />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
