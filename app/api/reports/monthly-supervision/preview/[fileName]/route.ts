import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/monthly-supervision/preview/Monthly%20Supervision.pdf?monthlySupervisionId=...
 *
 * El backend recibe el id en el **path** (`/{id}/preview`), no como query param.
 */
export const GET = createPdfProxyRoute({
  idParam: "monthlySupervisionId",
  buildUpstreamUrl: (apiBase, id) =>
    `${apiBase}/reports/monthly-supervision/${encodeURIComponent(id)}/preview`,
  fallbackFileName: "Monthly Supervision.pdf",
})
