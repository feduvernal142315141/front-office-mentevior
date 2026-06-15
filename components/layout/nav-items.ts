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
    label: "Clients",
    href: "/clients",
    icon: "Users",
    section: "main",
  },
  {
    label: "Users/Providers",
    href: "/users",
    icon: "UserCog",
    section: "main",
  },
  {
    label: "Session Note",
    href: "/session-note",
    icon: "NotebookPen",
    section: "main",
  },
  {
    label: "Schedules",
    href: "/schedules",
    icon: "CalendarCheck",
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
  // {
  //   label: "Behavior Plan",
  //   href: "/behavior-plan",
  //   icon: "TrendingUp",
  //   section: "main",
  //   children: [
  //     {
  //       label: "Maladaptive Behaviors",
  //       href: "/behavior-plan/maladaptive-behaviors",
  //     },
  //     {
  //       label: "Replacement Programs",
  //       href: "/behavior-plan/replacement-programs",
  //     },
  //     {
  //       label: "Caregiver Programs",
  //       href: "/behavior-plan/caregiver-programs",
  //     },
  //   ],
  // },
  {
    label: "Company Configuration",
    href: "/my-company",
    icon: "Building2",
    section: "main",  
    children: [
      {
        label: "Account Profile",
        href: "/my-company/account-profile",
      },
      {
        label: "Address",
        href: "/my-company/address",
      },
      {
        label: "Agreements",
        href: "/agreements",
      },
      {
        label: "Applicants",
        href: "/applicants",
      },
      {
        label: "Appointment",
        href: "/my-company/appointment",
      },
      {
        label: "Billing",
        href: "/my-company/billing",
        hasDeepChildren: true,
      },
      {
        label: "Credentials",
        href: "/my-company/credentials",
      },
      {
        label: "Data Collection",
        href: "/data-collection",
        hasDeepChildren: true,  
      },
      {
        label: "Documents",
        href: "/my-company/documents",
        hasDeepChildren: true,
      },
      {
        label: "Referring Physicians",
        href: "/my-company/physicians",
      },
      {
        label: "Roles",
        href: "/my-company/roles",
      },
      {
        label: "Service Plan",
        href: "/my-company/service-plans",
      },
      {
        label: "Services",
        href: "/my-company/services",
      },
      {
        label: "Signatures Caregiver",
        href: "/my-company/signatures-caregiver",
      },
      {
        label: "Supervision",
        href: "/my-company/events/supervision",
      },
      {
        label: "Template Documents",
        href: "/template-documents",
        hasDeepChildren: true,  
      },
    ],
  },
]
