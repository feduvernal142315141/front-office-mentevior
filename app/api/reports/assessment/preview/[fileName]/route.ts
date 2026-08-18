import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/assessment/preview/Behavior%20Analysis...pdf?assessmentId=...
 *
 * El backend responde `{ fileBase64 }` (no `application/pdf` crudo); el proxy
 * compartido ya decodifica esa forma.
 */
export const GET = createPdfProxyRoute({
  idParam: "assessmentId",
  buildUpstreamUrl: (apiBase, id) =>
    `${apiBase}/reports/assessment/behavior-analysis-support-plan?assessmentId=${encodeURIComponent(id)}`,
  fallbackFileName: "Behavior Analysis Assessment and Support Plan.pdf",
})
