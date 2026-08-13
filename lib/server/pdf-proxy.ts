import { request as httpsRequest } from "node:https"
import { request as httpRequest } from "node:http"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy same-origin de los PDFs del backend.
 *
 * **Por qué existe:** si el PDF se abre desde un `blob:`, el visor de Chrome
 * muestra un UUID como nombre de archivo y eso es lo que el usuario termina
 * guardando. Sirviéndolo desde una ruta propia con el nombre en el path y en el
 * `Content-Disposition`, el visor muestra "Case Supervision Log.pdf".
 *
 * De paso resuelve dos cosas que desde el navegador no se pueden: el token vive
 * en una cookie httpOnly, y el backend usa un certificado autofirmado.
 *
 * Antes esto estaba copiado en cada ruta —tres veces las mismas ~160 líneas de
 * red, parseo de cabeceras y base64—. Las rutas ahora sólo declaran de dónde
 * sacan el id y cómo se arma la URL del backend.
 */

type UpstreamResult = {
  status: number
  contentType: string
  contentDisposition: string | null
  body: Buffer
}

/**
 * Se usa `node:http(s)` y no el `fetch` global porque el backend expone un
 * certificado autofirmado (host por IP) que undici rechaza, y no se puede
 * saltear por request sin agregar dependencias.
 */
function fetchUpstream(url: string, token: string): Promise<UpstreamResult> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https:")
    const requestFn = isHttps ? httpsRequest : httpRequest

    const req = requestFn(
      url,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        // El mismo certificado que los usuarios aceptan en el navegador
        ...(isHttps ? { rejectUnauthorized: false } : {}),
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk: Buffer) => chunks.push(chunk))
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 500,
            contentType: String(res.headers["content-type"] ?? ""),
            contentDisposition: res.headers["content-disposition"] ?? null,
            body: Buffer.concat(chunks),
          })
        })
        res.on("error", reject)
      },
    )

    req.on("error", reject)
    req.setTimeout(30000, () => {
      req.destroy(new Error("Upstream request timed out"))
    })
    req.end()
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** `message`/`details` del contrato de error del backend, si el cuerpo es JSON */
function extractUpstreamMessage(body: Buffer): string | null {
  try {
    const parsed = JSON.parse(body.toString("utf8")) as Record<string, unknown>
    const candidate = parsed.message ?? parsed.details ?? parsed.error
    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null
  } catch {
    return null
  }
}

/**
 * Error como página HTML mínima, no como JSON: el único consumidor de estas
 * rutas es el `<iframe>` del DocumentViewer, y un JSON crudo ahí se ve como un
 * bug. La página muestra el mensaje real del backend cuando existe.
 */
function errorResponse(status: number, message: string): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Preview unavailable</title></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:440px;margin:24px;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);text-align:center;">
    <div style="font-size:34px;line-height:1;">📄</div>
    <h1 style="margin:14px 0 6px;font-size:17px;font-weight:600;color:#1e293b;">The PDF preview is not available</h1>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">${escapeHtml(message)}</p>
  </div>
</body>
</html>`
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  })
}

/** Nombre de archivo desde `Content-Disposition` (`filename=` / `filename*=`) */
function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null

  const utf8Match = /filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ""))
    } catch {
      // sigue con el formato plano
    }
  }

  const plainMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(header)
  if (plainMatch?.[2]) return plainMatch[2].trim()

  return null
}

export interface PdfProxyConfig {
  /** Query param del que sale el identificador del documento */
  idParam: string
  /**
   * Arma la URL del backend. El id llega **sin** escapar. `searchParams` trae el
   * resto de la query string por si la ruta necesita más de un identificador
   * (p.ej. batch claim + cliente).
   */
  buildUpstreamUrl: (apiBase: string, id: string, searchParams: URLSearchParams) => string
  /** Nombre a usar si la URL no trae uno y el backend tampoco */
  fallbackFileName: string
}

type RouteContext = { params: Promise<{ fileName: string }> }

/**
 * Devuelve el handler `GET` de una ruta de preview.
 *
 * Uso:
 * ```ts
 * export const GET = createPdfProxyRoute({
 *   idParam: "caseSupervisionLogId",
 *   buildUpstreamUrl: (base, id) => `${base}/reports/case-supervision-log/${encodeURIComponent(id)}/preview`,
 *   fallbackFileName: "Case Supervision Log.pdf",
 * })
 * ```
 */
export function createPdfProxyRoute(config: PdfProxyConfig) {
  return async function GET(req: NextRequest, context: RouteContext) {
    const id = req.nextUrl.searchParams.get(config.idParam)
    if (!id) {
      return errorResponse(400, `The document identifier (${config.idParam}) is missing.`)
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL
    if (!apiBase) {
      return errorResponse(500, "The API URL is not configured.")
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("mv_fo_token")?.value
    if (!token) {
      return errorResponse(401, "Your session has expired. Sign in again and retry.")
    }

    const { fileName: rawFileName } = await context.params
    const fallbackName =
      decodeURIComponent(rawFileName || config.fallbackFileName) || config.fallbackFileName

    let upstream: UpstreamResult
    try {
      upstream = await fetchUpstream(
        config.buildUpstreamUrl(apiBase, id, req.nextUrl.searchParams),
        token,
      )
    } catch (err) {
      console.error("[pdf-preview-proxy] upstream request failed:", err)
      return errorResponse(502, "The PDF service could not be reached. Try again in a moment.")
    }

    if (upstream.status < 200 || upstream.status >= 300) {
      // El motivo real viene en el cuerpo del error del backend; sin él, el
      // usuario ve un genérico y nadie sabe qué pasó (p.ej. el 422 de un
      // service log cuyas session notes todavía no están en Lock).
      const upstreamMessage = extractUpstreamMessage(upstream.body)
      console.error(
        `[pdf-preview-proxy] upstream responded ${upstream.status}:`,
        upstreamMessage ?? upstream.body.toString("utf8").slice(0, 500),
      )
      return errorResponse(
        upstream.status,
        upstreamMessage ?? `The document service responded with an error (${upstream.status}).`,
      )
    }

    const upstreamType = upstream.contentType.toLowerCase()
    const resolvedName = parseContentDispositionFilename(upstream.contentDisposition) ?? fallbackName

    let pdfBuffer: Buffer

    if (upstreamType.includes("application/json") || upstreamType.includes("text/")) {
      // El contrato devuelve `{ fileBase64 }`; algunos endpoints viejos, `{ data }`
      let raw: Record<string, unknown>
      try {
        raw = JSON.parse(upstream.body.toString("utf8")) as Record<string, unknown>
      } catch {
        return errorResponse(502, "The document service returned an invalid response.")
      }
      const base64 = String(raw.fileBase64 ?? raw.data ?? "")
      if (!base64) {
        return errorResponse(502, "The document service returned an empty document.")
      }
      pdfBuffer = Buffer.from(base64, "base64")
    } else {
      pdfBuffer = upstream.body
    }

    // `inline` mantiene el PDF dentro del visor; el nombre alimenta el "Guardar como"
    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `inline; filename="${resolvedName.replace(/"/g, "")}"`)
    headers.set("Cache-Control", "private, no-store")

    return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers })
  }
}
