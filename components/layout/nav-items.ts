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
  // {
  //   label: "Audit Logs",
  //   href: "/audit-logs",
  //   icon: "FileText",
  //   section: "system",
  //   disabled: true,
  // },
]
