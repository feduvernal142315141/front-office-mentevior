import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/case-supervision-log/preview/Case%20Supervision%20Log.pdf?caseSupervisionLogId=...
 *
 * El backend recibe el id en el **path** (`/{id}/preview`), como Monthly
 * Supervision y a diferencia de Clinical Monthly.
 */
export const GET = createPdfProxyRoute({
  idParam: "caseSupervisionLogId",
  buildUpstreamUrl: (apiBase, id) =>
    `${apiBase}/reports/case-supervision-log/${encodeURIComponent(id)}/preview`,
  fallbackFileName: "Case Supervision Log.pdf",
})
