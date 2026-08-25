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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useModulePermissions } from "@/lib/hooks/use-module-permissions"
import { PermissionModule } from "@/lib/utils/permissions-new"
import type { AppointmentStatus } from "@/lib/types/appointment.types"
import type { ModulePermissions } from "@/lib/hooks/use-module-permissions"

interface AppointmentContextMenuProps {
  x: number
  y: number
  appointmentId: string
  appointmentStatus?: AppointmentStatus
  hasSupervision?: boolean
  billingCodeAction?: "add_supervision" | "add_new_session" | "none"
  isSupervision?: boolean
  parentBillingCodeAction?: "add_supervision" | "add_new_session" | "none"
  onAction: (action: string, appointmentId: string) => void
  onClose: () => void
}

type PermissionLevel = "create" | "edit" | "delete" | "view"

interface MenuItem {
  action: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  danger?: boolean
  hideForStatus?: AppointmentStatus[]
  requires?: PermissionLevel
}

interface MenuSection {
  label?: string
  items: MenuItem[]
}

function isItemAllowed(item: MenuItem, perms: ModulePermissions): boolean {
  if (!item.requires) return true
  switch (item.requires) {
    case "create":
      return perms.canCreate
    case "edit":
      return perms.canEdit
    case "delete":
      return perms.canDelete
    case "view":
      return perms.canView
    default:
      return true
  }
}

function buildSupervisionSections(parentBillingCodeAction?: string): MenuSection[] {
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
          requires: "edit",
        },
        {
          action: "delete_sub_event",
          label: deleteLabel,
          icon: Trash2,
          danger: true,
          requires: "delete",
        },
      ],
    },
  ]
}

function buildSections(
  hasSupervision?: boolean,
  billingCodeAction?: "add_supervision" | "add_new_session" | "none",
): MenuSection[] {
  const actionItems: MenuItem[] = []

  if (!hasSupervision) {
    if (billingCodeAction === "add_new_session") {
      actionItems.push({
        action: "add_new_session",
        label: "Add New Session",
        icon: Users,
        requires: "create",
      })
    }

    if (billingCodeAction === "add_supervision") {
      actionItems.push({
        action: "supervision",
        label: "Add Supervision",
        icon: Users,
        requires: "create",
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
      requires: "edit",
    },
    {
      action: "delete",
      label: "Delete Session",
      icon: Trash2,
      danger: true,
      requires: "delete",
    },
    {
      action: "duplicate",
      label: "Duplicate Session",
      icon: Copy,
      requires: "create",
    },
    {
      action: "edit",
      label: "Edit Session",
      icon: Pencil,
      requires: "edit",
    },
    {
      action: "noshow",
      label: "Mark as No Show",
      icon: UserX,
      hideForStatus: ["Completed", "Cancelled", "NoShow"],
      requires: "edit",
    },
  )

  return [
    {
      label: "Actions",
      items: actionItems,
    },
    {
      label: "Navigate",
      items: [
        { action: "data_collection", label: "Data Collection", icon: BarChart3, requires: "view" },
        { action: "session_note", label: "Session Note", icon: FileText, requires: "view" },
      ],
    },
  ]
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
  onAction,
  onClose,
}: AppointmentContextMenuProps) {
  const perms = useModulePermissions(PermissionModule.SCHEDULE)

  const SECTIONS = useMemo(
    () =>
      isSupervision
        ? buildSupervisionSections(parentBillingCodeAction)
        : buildSections(hasSupervision, billingCodeAction),
    [isSupervision, parentBillingCodeAction, hasSupervision, billingCodeAction],
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
            isItemAllowed(item, perms) &&
            (!item.hideForStatus ||
              !appointmentStatus ||
              !item.hideForStatus.includes(appointmentStatus)),
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
