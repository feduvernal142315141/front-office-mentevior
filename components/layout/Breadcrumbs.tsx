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
  "billing-codes": "Billing Codes",
  "services-pending": "Services Pending",
  "billed-claims": "Billed Claims",
  "credentials": "Credentials",
  "events": "Events",
  "physicians": "Physicians",
  "service-plans": "Service Plans",
  "documents": "Documents",
  
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
  let filteredSegments = segments.filter(segment => !isUUID(segment))

  // Special handling: Inject "Documents" parent for clinical-documents and hr-documents
  if (filteredSegments.includes("clinical-documents") || filteredSegments.includes("hr-documents")) {
    const documentsIndex = filteredSegments.findIndex(seg => seg === "clinical-documents" || seg === "hr-documents")
    
    // Only inject if "documents" is not already present
    if (!filteredSegments.includes("documents")) {
      // Insert "my-company" and "documents" before the document type
      const beforeDocs = filteredSegments.slice(0, documentsIndex)
      const afterDocs = filteredSegments.slice(documentsIndex)
      
      // Check if my-company is already there
      if (!beforeDocs.includes("my-company")) {
        filteredSegments = ["my-company", "documents", ...afterDocs]
      } else {
        filteredSegments = [...beforeDocs, "documents", ...afterDocs]
      }
    }
  }

  // Build breadcrumbs from filtered segments
  const breadcrumbs = filteredSegments.map((segment, index) => {
    // Build href correctly by skipping injected segments that don't have real routes
    let href = ""
    
    if (segment === "documents" && (filteredSegments.includes("clinical-documents") || filteredSegments.includes("hr-documents"))) {
      // Documents is virtual, point to /my-company/documents
      href = "/my-company/documents"
    } else if (segment === "my-company" && index === 0 && (filteredSegments.includes("clinical-documents") || filteredSegments.includes("hr-documents"))) {
      // My Company link when it's injected
      href = "/my-company"
    } else {
      // Build normal href based on actual path segments
      const actualSegments = segments.filter(s => !isUUID(s))
      const segmentIndexInActual = actualSegments.indexOf(segment)
      
      if (segmentIndexInActual !== -1) {
        href = "/" + actualSegments.slice(0, segmentIndexInActual + 1).join("/")
      } else {
        href = "/" + filteredSegments.slice(0, index + 1).join("/")
      }
    }
    
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
