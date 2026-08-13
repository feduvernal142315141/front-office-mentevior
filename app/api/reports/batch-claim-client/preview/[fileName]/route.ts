import { createPdfProxyRoute } from "@/lib/server/pdf-proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/reports/batch-claim-client/preview/CMS-1500%20Jane%20Doe.pdf?batchClaimId=...&clientId=...
 *
 * CMS-1500 de un solo cliente dentro del batch. El backend devuelve 422 si el
 * batch no tiene appointments seleccionados para ese cliente.
 */
export const GET = createPdfProxyRoute({
  idParam: "batchClaimId",
  buildUpstreamUrl: (apiBase, id, searchParams) => {
    const clientId = searchParams.get("clientId") ?? ""
    return `${apiBase}/batch-claims/${encodeURIComponent(id)}/clients/${encodeURIComponent(clientId)}/preview`
  },
  fallbackFileName: "Batch Claim CMS-1500.pdf",
})
