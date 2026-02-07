"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { Fragment } from "react"

function isUUID(segment: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(segment)
}

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
  "my-profile": "My Profile",
  "manager": "Profile Management",
  
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
  "details": "Details",
}

// Helper to get label for a segment
function getSegmentLabel(segment: string): string {
  return SEGMENT_LABEL_MAP[segment] || segment.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ")
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const router = useRouter()
  const segments = pathname.split("/").filter(Boolean)

  // Replace UUID with "Details" for applicants
  let filteredSegments = segments.map((segment, index) => {
    if (isUUID(segment)) {
      // Check if previous segment is "applicants"
      if (index > 0 && segments[index - 1] === "applicants") {
        return "details"
      }
      return null // Filter out other UUIDs
    }
    return segment
  }).filter((segment): segment is string => segment !== null)

  // Add "my-company" prefix for applicants and agreements if not present
  if (filteredSegments.includes("applicants") && !filteredSegments.includes("my-company")) {
    const applicantsIndex = filteredSegments.indexOf("applicants")
    filteredSegments = ["my-company", ...filteredSegments]
  }

  if (filteredSegments.includes("agreements") && !filteredSegments.includes("my-company")) {
    filteredSegments = ["my-company", ...filteredSegments]
  }

  if (filteredSegments.includes("clinical-documents") || filteredSegments.includes("hr-documents")) {
    const documentsIndex = filteredSegments.findIndex(seg => seg === "clinical-documents" || seg === "hr-documents")
    
    if (!filteredSegments.includes("documents")) {
      const beforeDocs = filteredSegments.slice(0, documentsIndex)
      const afterDocs = filteredSegments.slice(documentsIndex)
      
      if (!beforeDocs.includes("my-company")) {
        filteredSegments = ["my-company", "documents", ...afterDocs]
      } else {
        filteredSegments = [...beforeDocs, "documents", ...afterDocs]
      }
    }
  }

  const breadcrumbs = filteredSegments.map((segment, index) => {
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

  if (breadcrumbs.length <= 1) return null

  const showBackButton = breadcrumbs.length >= 3
  const backHref = showBackButton ? breadcrumbs[breadcrumbs.length - 2].href : null

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <nav className="flex items-center gap-3">
      {showBackButton && (
        <>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-gray-300" />
        </>
      )}
      
      <div className="flex items-center gap-2 text-sm text-gray-500">
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
      </div>
    </nav>
  )
}
