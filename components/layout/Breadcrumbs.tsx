"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Fragment } from "react"

// Helper function to detect if a segment is a UUID or ID
function isUUID(segment: string): boolean {
  // Match UUID pattern: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(segment)
}

// Map route segments to readable labels
const SEGMENT_LABEL_MAP: Record<string, string> = {
  // Main modules
  "dashboard": "Dashboard",
  "users": "Users",
  "clients": "Clients",
  "schedules": "Schedules",
  "session-note": "Session Note",
  "clinical-monthly": "Clinical Monthly",
  "monthly-supervisions": "Monthly Supervisions",
  "service-log": "Service Log",
  "assessment": "Assessment",
  "behavior-plan": "Behavior Plan",
  "my-company": "My Company",
  
  // Behavior Plan children
  "maladaptive-behaviors": "Maladaptive Behaviors",
  "replacement-programs": "Replacement Programs",
  "caregiver-programs": "Caregiver Programs",
  
  // My Company children
  "roles": "Roles",
  "account-profile": "Account Profile",
  "address": "Address",
  "billing": "Billing",
  "credentials": "Credentials",
  "events": "Events",
  "physicians": "Physicians",
  "service-plans": "Service Plans",
  
  // Data Collection
  "data-collection": "Data Collection",
  "datasheets": "Datasheets",
  "onsite-collection": "On-site Collection",
  "charts": "Charts",
  "data-analysis": "Data Analysis",
  "raw-data": "Raw Data",
  
  // Signatures Caregiver
  "signatures-caregiver": "Signatures Caregiver",
  "check": "Check Signatures",
  "sign": "Sign Signatures",
  
  // Template Documents
  "template-documents": "Template Documents",
  "monthly-supervision": "Monthly Supervision",
  
  // Other modules
  "clinical-documents": "Clinical Documents",
  "hr-documents": "HR Documents",
  "agreements": "Agreements",
  "applicants": "Applicants",
  
  // Common actions
  "create": "Create",
  "edit": "Edit",
  "new": "New",
  "view": "View",
}

// Helper to get label for a segment
function getSegmentLabel(segment: string): string {
  return SEGMENT_LABEL_MAP[segment] || segment.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ")
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  // Filter out UUID/ID segments first
  const filteredSegments = segments.filter(segment => !isUUID(segment))

  // Build breadcrumbs from filtered segments
  const breadcrumbs = filteredSegments.map((segment, index) => {
    const href = "/" + filteredSegments.slice(0, index + 1).join("/")
    const label = getSegmentLabel(segment)
    const isLast = index === filteredSegments.length - 1

    return {
      href,
      label,
      isLast,
    }
  })

  // Solo mostrar breadcrumbs si hay más de un segmento visible después de filtrar
  // Ejemplo: /users/create → ["Users", "Create"] ✅ (2 visible)
  // Ejemplo: /users → ["Users"] ❌ (1 visible)
  // Ejemplo: /users/uuid/edit → ["Users", "Edit"] ✅ (2 visible, href correcto: /users y /users/edit)
  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500">
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
          {crumb.isLast ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
