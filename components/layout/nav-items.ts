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
  hasDeepChildren?: boolean 
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
    section: "main",  
    children: [
      {
        label: "Roles",
        href: "/my-company/roles",
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
        label: "Credentials",
        href: "/my-company/credentials",
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
        label: "Events",
        href: "/my-company/events",
        hasDeepChildren: true,
      },
      {
        label: "Billing",
        href: "/my-company/billing",
        hasDeepChildren: true,
      },
      {
        label: "Data Collection",
        href: "/data-collection",
        hasDeepChildren: true,  
      },
      {
        label: "Signatures Caregiver",
        href: "/my-company/signatures-caregiver",
      },
      {
        label: "Template Documents",
        href: "/template-documents",
        hasDeepChildren: true,  
      },
      {
        label: "Documents",
        href: "/my-company/documents",
        hasDeepChildren: true,
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
