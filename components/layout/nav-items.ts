import { ICON_MAP } from "./Sidebar"

export type NavItem = {
  label: string
  href: string
  icon: keyof typeof ICON_MAP
  section: "main" | "system"
  disabled?: boolean
  children?: NavSubItem[]
}

export type NavSubItem = {
  label: string
  href: string
  disabled?: boolean
  hasDeepChildren?: boolean  // Indicates 3rd level exists (shown as cards, not in sidebar)
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "Gauge",
    section: "main",
  },
  {
    label: "Users",
    href: "/users",
    icon: "UserCog",
    section: "main",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: "Users",
    section: "main",
  },
  {
    label: "Schedules",
    href: "/schedules",
    icon: "CalendarCheck",
    section: "main",
  },
  {
    label: "Session Note",
    href: "/session-note",
    icon: "NotebookPen",
    section: "main",
  },
  {
    label: "Clinical Monthly",
    href: "/clinical-monthly",
    icon: "Hospital",
    section: "main",
  },
  {
    label: "Monthly Supervisions",
    href: "/monthly-supervisions",
    icon: "CalendarClock",
    section: "main",
  },
  {
    label: "Service Log",
    href: "/service-log",
    icon: "ClipboardList",
    section: "main",
  },
  {
    label: "Assessment",
    href: "/assessment",
    icon: "ClipboardCheck",
    section: "main",
  },
  {
    label: "Behavior Plan",
    href: "/behavior-plan",
    icon: "TrendingUp",
    section: "main",
    children: [
      {
        label: "Maladaptive Behaviors",
        href: "/behavior-plan/maladaptive-behaviors",
      },
      {
        label: "Replacement Programs",
        href: "/behavior-plan/replacement-programs",
      },
      {
        label: "Caregiver Programs",
        href: "/behavior-plan/caregiver-programs",
      },
    ],
  },
  {
    label: "My Company",
    href: "/my-company",
    icon: "Building2",
    section: "main",  // Changed from "system" to "main" - now appears last in main section
    children: [
      {
        label: "Roles",
        href: "/roles",
      },
      {
        label: "Account Profile",
        href: "/my-company/account-profile",
      },
      {
        label: "Address",
        href: "/my-company/address",
      },
      {
        label: "Billing",
        href: "/my-company/billing",
      },
      {
        label: "Credentials",
        href: "/my-company/credentials",
      },
      {
        label: "Events",
        href: "/my-company/events",
      },
      {
        label: "Physicians",
        href: "/my-company/physicians",
      },
      {
        label: "Service Plans",
        href: "/my-company/service-plans",
      },
      {
        label: "Data Collection",
        href: "/data-collection",
        hasDeepChildren: true,  // Has 3rd level - shows > icon
      },
      {
        label: "Signatures Caregiver",
        href: "/signatures-caregiver",
        hasDeepChildren: true,  // Has 3rd level - shows > icon
      },
      {
        label: "Template Documents",
        href: "/template-documents",
        hasDeepChildren: true,  // Has 3rd level - shows > icon
      },
      {
        label: "Clinical Documents",
        href: "/clinical-documents",
      },
      {
        label: "HR Documents",
        href: "/hr-documents",
      },
      {
        label: "Agreements",
        href: "/agreements",
      },
      {
        label: "Applicants",
        href: "/applicants",
      },
    ],
  },
]
