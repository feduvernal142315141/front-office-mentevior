import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/batch-claim/preview/Batch%20Claim%20CMS-1500.pdf?batchClaimId=...
 *
 * El backend responde `{ fileBase64 }` con el CMS-1500 de todo el batch
 * (una página por grupo cliente/autorización/insurance, 6 service lines por página).
 */
export const GET = createPdfProxyRoute({
  idParam: "batchClaimId",
  buildUpstreamUrl: (apiBase, id) =>
    `${apiBase}/batch-claims/${encodeURIComponent(id)}/preview`,
  fallbackFileName: "Batch Claim CMS-1500.pdf",
})
