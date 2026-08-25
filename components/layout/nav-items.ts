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
    // Padre visual: no tiene permiso propio, se muestra si el usuario puede ver
    // alguno de sus hijos. Los hijos conservan sus URLs de siempre (`/clients`,
    // `/users`…) para no romper enlaces ni rutas existentes — mismo criterio que
    // ya usa Company Configuration con `/agreements` y `/applicants`.
    label: "Clinical Options",
    href: "/clinical-options",
    icon: "Stethoscope",
    section: "main",
    children: [
      {
        label: "Clients",
        href: "/clients",
      },
      {
        label: "Users/Providers",
        href: "/users",
      },
      {
        label: "Session Note",
        href: "/session-note",
      },
      {
        label: "Schedules",
        href: "/schedules",
      },
      {
        label: "Clinical Monthly",
        href: "/clinical-monthly",
      },
      {
        label: "Monthly Supervisions",
        href: "/monthly-supervisions",
      },
      {
        label: "Case Supervision Log",
        href: "/case-supervision-log",
      },
      {
        label: "Service Log",
        href: "/service-log",
      },
      {
        label: "Assessment",
        href: "/assessment",
      },
    ],
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
        label: "Billing",
        href: "/my-company/billing",
        hasDeepChildren: true,
      },
      {
        label: "Credentials",
        href: "/my-company/credentials",
      },
      // Hidden until implementation is ready — see lib/constants/hidden-modules.ts
      // {
      //   label: "Data Collection",
      //   href: "/data-collection",
      //   hasDeepChildren: true,
      // },
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
        label: "Providers on File",
        href: "/my-company/providers-on-file",
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
        label: "Session",
        href: "/my-company/session",
      },
      {
        label: "Signatures Caregiver",
        href: "/my-company/signatures-caregiver",
      },
      {
        label: "Supervision",
        href: "/my-company/events/supervision",
      },
      // Hidden until implementation is ready — see lib/constants/hidden-modules.ts
      // {
      //   label: "Template Documents",
      //   href: "/template-documents",
      //   hasDeepChildren: true,
      // },
    ],
  },
]
