import {
    Building2,
    LayoutDashboard,
    Users,
    Settings,
    FileText,
    CreditCard,
  } from "lucide-react"
  
  export const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      section: "main",
    },
    {
      label: "Organizations",
      href: "/organizations",
      icon: 1,
      section: "main",
    },
    // {
    //   label: "Settings",
    //   href: "/settings",
    //   icon: Settings,
    //   section: "system",
    //   disabled: true,
    // },
    // {
    //   label: "Billing",
    //   href: "/billing",
    //   icon: CreditCard,
    //   section: "system",
    //   disabled: true,
    // },
    // {
    //   label: "Audit Logs",
    //   href: "/audit-logs",
    //   icon: FileText,
    //   section: "system",
    //   disabled: true,
    // },
  ]
  