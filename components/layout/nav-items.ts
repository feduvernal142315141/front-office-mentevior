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
    label: "Organizations",
    href: "/organizations",
    icon: "Building2",
    section: "main",
  },
  // {
  //   label: "Settings",
  //   href: "/settings",
  //   icon: "Settings",
  //   section: "system",
  //   disabled: true,
  // },
  // {
  //   label: "Billing",
  //   href: "/billing",
  //   icon: "CreditCard",
  //   section: "system",
  //   disabled: true,
  // },
  // {
  //   label: "Audit Logs",
  //   href: "/audit-logs",
  //   icon: "FileText",
  //   section: "system",
  //   disabled: true,
  // },
]
