import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/appointment-note/preview/Session%20Note.pdf?appointmentId=...
 *
 * El id es el del **appointment**, no el de la nota, y va como query param.
 */
export const GET = createPdfProxyRoute({
  idParam: "appointmentId",
  buildUpstreamUrl: (apiBase, id) =>
    `${apiBase}/reports/appointment-note/preview?appointmentId=${encodeURIComponent(id)}`,
  fallbackFileName: "Session Note.pdf",
})
