/**
 * Modules hidden from navigation until implementation is ready.
 * Routes and pages remain in the codebase; only UI entry points are suppressed.
 */
export const HIDDEN_NAV_HREFS = new Set([
  "/data-collection",
  "/template-documents",
])

export const HIDDEN_BILLING_HREFS = new Set([
  "/my-company/billing/services-pending",
])

/**
 * Permission modules hidden from the Roles matrix (same unimplemented surfaces).
 * IDs stay in permissions-map so existing JWTs still parse.
 */
export const HIDDEN_PERMISSION_MODULES = new Set([
  "datasheets",
  "on_site_collection",
  "charts",
  "data_analysis",
  "raw_data",
  "session_note_configuration",
  "clinical_monthly_configuration",
  "service_log_configuration",
  "monthly_supervisions_configuration",
  "assessment_configuration",
  "services_pending_billing",
  "behavior_plan",
  "maladaptive_behaviors",
  "replacement_programs",
  "caregiver_programs",
  "monthly_report",
])

export function isHiddenNavRoute(href: string): boolean {
  if (HIDDEN_NAV_HREFS.has(href)) return true
  for (const hidden of HIDDEN_NAV_HREFS) {
    if (href.startsWith(`${hidden}/`)) return true
  }
  return false
}

export function isHiddenPermissionModule(module: string): boolean {
  return HIDDEN_PERMISSION_MODULES.has(module)
}
