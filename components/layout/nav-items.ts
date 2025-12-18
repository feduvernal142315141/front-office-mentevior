import { ICON_MAP } from "./Sidebar"

export type NavItem = {
  label: string
  href: string
  icon: keyof typeof ICON_MAP
  section: "main" | "system"
  disabled?: boolean
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "Gauge",
    section: "main",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: "Users",
    section: "system",
    disabled: true,
  },
  {
    label: "Schedules",
    href: "/schedules",
    icon: "CalendarCheck",
    section: "system",
    disabled: true,
  },
  {
    label: "Session Note",
    href: "/session-note",
    icon: "NotebookPen",
    section: "system",
    disabled: true,
  },
  {
    label: "Clinical Monthly",
    href: "/clinical-monthly",
    icon: "Hospital",
    section: "system",
    disabled: true,
  },
  {
    label: "Monthly Supervisions",
    href: "/monthly-supervisions",
    icon: "CalendarClock",
    section: "system",
    disabled: true,
  },
  {
    label: "Service Log",
    href: "/service-log",
    icon: "ClipboardList",
    section: "system",
    disabled: true,
  },
  {
    label: "Assessment",
    href: "/assessment",
    icon: "ClipboardCheck",
    section: "system",
    disabled: true,
  },
  {
    label: "Behavior Plan",
    href: "/behavior-plan",
    icon: "TrendingUp",
    section: "system",
    disabled: true,
  },
  {
    label: "My profile",
    href: "/my-profile",
    icon: "User",
    section: "system",
    disabled: true,
  },
]
