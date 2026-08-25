import { PermissionAction, PermissionModule } from "@/lib/utils/permissions-new"

/** Ruta → módulo de permiso. Rutas más específicas primero al resolver. */
export const ROUTE_TO_PERMISSION_MAP: Record<string, string> = {
  "/dashboard": "dashboard",
  "/users": PermissionModule.USERS_PROVIDERS,
  "/clients": PermissionModule.CLIENTS,
  "/schedules": PermissionModule.SCHEDULE,
  "/session-note": PermissionModule.SESSION_NOTE,
  "/clinical-monthly": PermissionModule.CLINICAL_MONTHLY,
  "/monthly-supervisions": PermissionModule.MONTHLY_SUPERVISIONS,
  "/case-supervision-log": PermissionModule.CASE_SUPERVISION,
  "/service-log": PermissionModule.SERVICE_LOG,
  "/assessment": PermissionModule.ASSESSMENT,

  "/behavior-plan/maladaptive-behaviors": PermissionModule.MALADAPTIVE_BEHAVIORS,
  "/behavior-plan/replacement-programs": PermissionModule.REPLACEMENT_PROGRAMS,
  "/behavior-plan/caregiver-programs": PermissionModule.CAREGIVER_PROGRAMS,

  "/my-company/roles": PermissionModule.ROLE,
  "/my-company/account-profile": PermissionModule.ACCOUNT_PROFILE,
  "/my-company/address": PermissionModule.ACCOUNT_PROFILE,
  "/my-company/credentials": PermissionModule.ACCOUNT_PROFILE,
  "/my-company/physicians": PermissionModule.PHYSICIANS,
  "/my-company/providers-on-file": PermissionModule.PROVIDER_ON_FILE,
  "/my-company/service-plans": PermissionModule.SERVICE_PLANS,
  "/my-company/services": PermissionModule.ACCOUNT_PROFILE,
  "/my-company/signatures-caregiver": PermissionModule.SIGNATURES_CAREGIVER,

  "/my-company/session": PermissionModule.APPOINTMENT,
  "/my-company/events/appointment": PermissionModule.APPOINTMENT,
  "/my-company/events/service-plan": PermissionModule.SERVICE_PLAN,
  "/my-company/events/supervision": PermissionModule.SUPERVISION,

  "/my-company/billing/billing-codes": PermissionModule.BILLING_CODE,
  "/my-company/billing/payers": PermissionModule.PAYERS,
  "/my-company/billing/services-pending": PermissionModule.SERVICES_PENDING_BILLING,
  "/my-company/billing/billed-claims": PermissionModule.BILLED_CLAIMS,

  "/clinical-documents": PermissionModule.CLINICAL_DOCUMENTS,
  "/hr-documents": PermissionModule.HR_DOCUMENTS,
  "/agreements": PermissionModule.AGREEMENTS,
  "/applicants": PermissionModule.APPLICANTS,

  "/data-collection/datasheets": PermissionModule.DATASHEETS,
  "/data-collection/onsite-collection": PermissionModule.ON_SITE_COLLECTION,
  "/data-collection/charts": PermissionModule.CHARTS,
  "/data-collection/data-analysis": PermissionModule.DATA_ANALYSIS,
  "/data-collection/raw-data": PermissionModule.RAW_DATA,

  "/template-documents/session-note": PermissionModule.SESSION_NOTE_CONFIGURATION,
  "/template-documents/service-log": PermissionModule.SERVICE_LOG_CONFIGURATION,
  "/template-documents/clinical-monthly": PermissionModule.CLINICAL_MONTHLY_CONFIGURATION,
  "/template-documents/monthly-supervision": PermissionModule.MONTHLY_SUPERVISIONS_CONFIGURATION,
  "/template-documents/assessment": PermissionModule.ASSESSMENT_CONFIGURATION,

  "/my-profile": "my-profile",
  "/change-password": "change-password",

  // Padres visuales — acceso vía hijos
  "/my-company": PermissionModule.ACCOUNT_PROFILE,
}

export const PARENT_TO_CHILDREN_MAP: Record<string, string[]> = {
  "/clinical-options": [
    "/clients",
    "/users",
    "/session-note",
    "/schedules",
    "/clinical-monthly",
    "/monthly-supervisions",
    "/service-log",
    "/assessment",
  ],
  "/my-company": [
    "/my-company/roles",
    "/my-company/account-profile",
    "/my-company/address",
    "/my-company/credentials",
    "/my-company/physicians",
    "/my-company/providers-on-file",
    "/my-company/service-plans",
    "/my-company/session",
    "/my-company/events",
    "/my-company/billing",
    "/data-collection",
    "/my-company/signatures-caregiver",
    "/template-documents",
    "/my-company/documents",
    "/agreements",
    "/applicants",
  ],
  "/my-company/documents": ["/clinical-documents", "/hr-documents"],
  "/behavior-plan": [
    "/behavior-plan/maladaptive-behaviors",
    "/behavior-plan/replacement-programs",
    "/behavior-plan/caregiver-programs",
  ],
  "/my-company/events": [
    "/my-company/events/appointment",
    "/my-company/events/service-plan",
    "/my-company/events/supervision",
  ],
  "/my-company/billing": [
    "/my-company/billing/billing-codes",
    "/my-company/billing/services-pending",
    "/my-company/billing/billed-claims",
    "/my-company/billing/payers",
  ],
  "/data-collection": [
    "/data-collection/datasheets",
    "/data-collection/onsite-collection",
    "/data-collection/charts",
    "/data-collection/data-analysis",
    "/data-collection/raw-data",
  ],
  "/template-documents": [
    "/template-documents/session-note",
    "/template-documents/service-log",
    "/template-documents/clinical-monthly",
    "/template-documents/monthly-supervision",
    "/template-documents/assessment",
  ],
}

const SORTED_ROUTES = Object.keys(ROUTE_TO_PERMISSION_MAP).sort((a, b) => b.length - a.length)

/** Resuelve el módulo de permiso para un pathname (match más específico primero). */
export function resolveRouteModule(pathname: string): string | null {
  const normalized = pathname.split("?")[0]
  for (const route of SORTED_ROUTES) {
    if (normalized === route || normalized.startsWith(`${route}/`)) {
      return ROUTE_TO_PERMISSION_MAP[route]
    }
  }
  const segments = normalized.split("/").filter(Boolean)
  if (segments.length === 0) return null
  const baseRoute = `/${segments[0]}`
  return ROUTE_TO_PERMISSION_MAP[baseRoute] ?? null
}

/** CREATE en /create o /new; EDIT en /edit. */
export function resolveRouteRequiredAction(pathname: string): PermissionAction | null {
  const normalized = pathname.split("?")[0]
  if (/\/create(\/|$)/.test(normalized) || /\/new(\/|$)/.test(normalized)) {
    return PermissionAction.CREATE
  }
  if (/\/edit(\/|$)/.test(normalized)) {
    return PermissionAction.EDIT
  }
  return null
}
