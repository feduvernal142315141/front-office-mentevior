import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/clinical-monthly/preview/Clinical%20Monthly.pdf?clinicalMonthlyId=...
 *
 * Acá el backend recibe el id como **query param**, no en el path.
 */
export const GET = createPdfProxyRoute({
  idParam: "clinicalMonthlyId",
  buildUpstreamUrl: (apiBase, id) =>
    `${apiBase}/reports/clinical-monthly/preview?clinicalMonthlyId=${encodeURIComponent(id)}`,
  fallbackFileName: "Clinical Monthly.pdf",
})
