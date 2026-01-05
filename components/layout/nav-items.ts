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
    section: "system",
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
    ],
  },
  {
    label: "Data Collection",
    href: "/data-collection",
    icon: "BarChart3",
    section: "system",
    children: [
      {
        label: "Datasheets",
        href: "/data-collection/datasheets",
      },
      {
        label: "On-site Collection",
        href: "/data-collection/onsite-collection",
      },
      {
        label: "Charts",
        href: "/data-collection/charts",
      },
      {
        label: "Data Analysis",
        href: "/data-collection/data-analysis",
      },
      {
        label: "Raw Data",
        href: "/data-collection/raw-data",
      },
    ],
  },
  {
    label: "Signatures Caregiver",
    href: "/signatures-caregiver",
    icon: "FileSignature",
    section: "system",
    children: [
      {
        label: "Check Signatures",
        href: "/signatures-caregiver/check",
      },
      {
        label: "Sign Signatures",
        href: "/signatures-caregiver/sign",
      },
    ],
  },
  {
    label: "Template Documents",
    href: "/template-documents",
    icon: "FileText",
    section: "system",
    children: [
      {
        label: "Session Note",
        href: "/template-documents/session-note",
      },
      {
        label: "Service Log",
        href: "/template-documents/service-log",
      },
      {
        label: "Clinical Monthly",
        href: "/template-documents/clinical-monthly",
      },
      {
        label: "Monthly Supervision",
        href: "/template-documents/monthly-supervision",
      },
      {
        label: "Assessment",
        href: "/template-documents/assessment",
      },
    ],
  },
  {
    label: "Clinical Documents",
    href: "/clinical-documents",
    icon: "FolderHeart",
    section: "system",
  },
  {
    label: "HR Documents",
    href: "/hr-documents",
    icon: "FolderOpen",
    section: "system",
  },
  {
    label: "Agreements",
    href: "/agreements",
    icon: "FileCheck",
    section: "system",
  },
  {
    label: "Applicants",
    href: "/applicants",
    icon: "UserPlus",
    section: "system",
  },
]
