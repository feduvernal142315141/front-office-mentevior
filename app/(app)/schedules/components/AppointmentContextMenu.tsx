"use client"

import { useEffect, useMemo, useRef } from "react"
import {
  FileText,
  BarChart3,
  Pencil,
  Copy,
  UserX,
  XCircle,
  Trash2,
  Users,
  Lock,
  LockOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppointmentStatus } from "@/lib/types/appointment.types"

interface AppointmentContextMenuProps {
  x: number
  y: number
  appointmentId: string
  appointmentStatus?: AppointmentStatus
  hasSupervision?: boolean
  /** "add_supervision" | "add_new_session" | "none" — determined by parent billing code */
  billingCodeAction?: "add_supervision" | "add_new_session" | "none"
  /** When true, shows sub-event-specific items instead of appointment items */
  isSupervision?: boolean
  /** Parent billing code action — helps differentiate supervision vs session/supervision menus */
  parentBillingCodeAction?: "add_supervision" | "add_new_session" | "none"
  /** Whether the appointment is currently locked (blocked or notCanEdit) */
  isLocked?: boolean
  /** Whether the current user can toggle edit locks */
  canToggleLock?: boolean
  onAction: (action: string, appointmentId: string) => void
  onClose: () => void
}

interface MenuItem {
  action: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  danger?: boolean
  hideForStatus?: AppointmentStatus[]
}

interface MenuSection {
  label?: string
  items: MenuItem[]
}

function buildSupervisionSections(parentBillingCodeAction?: string): MenuSection[] {
  // Parent is 97153/97152 → sub-event is a "Session / Supervision" → "Edit Session"
  const isSessionSupervision = parentBillingCodeAction === "add_new_session"

  const deleteLabel = isSessionSupervision ? "Delete Session" : "Delete Supervision"

  return [
    {
      label: "Actions",
      items: [
        {
          action: isSessionSupervision ? "edit_session_supervision" : "supervision",
          label: isSessionSupervision ? "Edit Session" : "Edit Supervision",
          icon: Pencil,
        },
        {
          action: "delete_sub_event",
          label: deleteLabel,
          icon: Trash2,
          danger: true,
        },
      ],
    },
  ]
}

function buildSections(
  hasSupervision?: boolean,
  billingCodeAction?: "add_supervision" | "add_new_session" | "none",
  isLocked?: boolean,
  canToggleLock?: boolean,
): MenuSection[] {
  const actionItems: MenuItem[] = []

  // Only show add actions when parent doesn't already have a sub-event
  if (!hasSupervision) {
    // 97153/97152 codes → Add New Session
    if (billingCodeAction === "add_new_session") {
      actionItems.push({
        action: "add_new_session",
        label: "Add New Session",
        icon: Users,
      })
    }

    // 97155 codes → Add Supervision
    if (billingCodeAction === "add_supervision") {
      actionItems.push({
        action: "supervision",
        label: "Add Supervision",
        icon: Users,
      })
    }
  }

  actionItems.push(
    {
      action: "cancel",
      label: "Cancel Session",
      icon: XCircle,
      danger: true,
      hideForStatus: ["Completed", "Cancelled", "NoShow"],
    },
    { action: "delete", label: "Delete Session", icon: Trash2, danger: true },
    { action: "duplicate", label: "Duplicate Session", icon: Copy },
    { action: "edit", label: "Edit Session", icon: Pencil },
    {
      action: "noshow",
      label: "Mark as No Show",
      icon: UserX,
      hideForStatus: ["Completed", "Cancelled", "NoShow"],
    },
  )

  const sections: MenuSection[] = [
    {
      label: "Actions",
      items: actionItems,
    },
    {
      label: "Navigate",
      items: [
        { action: "data_collection", label: "Data Collection", icon: BarChart3 },
        { action: "session_note", label: "Session Note", icon: FileText },
      ],
    },
  ]

  if (canToggleLock) {
    sections.push({
      items: [
        {
          action: "toggle_edit_lock",
          label: isLocked ? "Unlock Editing" : "Lock Editing",
          icon: isLocked ? LockOpen : Lock,
        },
      ],
    })
  }

  return sections
}

export function AppointmentContextMenu({
  x,
  y,
  appointmentId,
  appointmentStatus,
  hasSupervision,
  billingCodeAction,
  isSupervision,
  parentBillingCodeAction,
  isLocked,
  canToggleLock,
  onAction,
  onClose,
}: AppointmentContextMenuProps) {
  const SECTIONS = useMemo(
    () => (isSupervision ? buildSupervisionSections(parentBillingCodeAction) : buildSections(hasSupervision, billingCodeAction, isLocked, canToggleLock)),
    [isSupervision, parentBillingCodeAction, hasSupervision, billingCodeAction, isLocked, canToggleLock],
  )
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  const adjustedPosition = {
    left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - 320),
  }

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[100]",
        "w-[210px] p-1",
        "bg-white/95 backdrop-blur-xl rounded-xl",
        "border border-gray-200/70",
        "shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)]",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150",
      )}
      style={{
        left: `${adjustedPosition.left}px`,
        top: `${adjustedPosition.top}px`,
      }}
    >
      {SECTIONS.map((section, sIndex) => {
        const visibleItems = section.items.filter(
          (item) =>
            !item.hideForStatus ||
            !appointmentStatus ||
            !item.hideForStatus.includes(appointmentStatus),
        )
        if (visibleItems.length === 0) return null

        return (
          <div key={sIndex}>
            {sIndex > 0 && <div className="my-1 mx-1.5 h-px bg-gray-100" />}
            {section.label && (
              <div className="px-2.5 pt-2 pb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {section.label}
                </span>
              </div>
            )}
            {visibleItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.action}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-[7px]",
                    "text-[13px] font-medium text-left rounded-lg",
                    "transition-colors duration-100",
                    item.danger
                      ? "text-red-600 hover:bg-red-50/80"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                  onClick={() => onAction(item.action, appointmentId)}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      item.danger ? "text-red-400" : "text-gray-400",
                    )}
                  />
                  {item.label}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
