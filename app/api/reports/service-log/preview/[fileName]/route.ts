import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/service-log/preview/Service%20Log.pdf?serviceLogId=...
 *
 * El backend recibe el id en el **path** (`/{id}/preview`) y responde
 * `{ fileBase64 }`, que el proxy decodifica server-side.
 */
export const GET = createPdfProxyRoute({
  idParam: "serviceLogId",
  buildUpstreamUrl: (apiBase, id) =>
    `${apiBase}/reports/service-log/${encodeURIComponent(id)}/preview`,
  fallbackFileName: "Service Log.pdf",
})
