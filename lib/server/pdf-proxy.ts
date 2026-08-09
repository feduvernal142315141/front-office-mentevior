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
  /** Arma la URL del backend. El id llega **sin** escapar */
  buildUpstreamUrl: (apiBase: string, id: string) => string
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
      return NextResponse.json({ error: `${config.idParam} is required` }, { status: 400 })
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL
    if (!apiBase) {
      return NextResponse.json({ error: "API URL is not configured" }, { status: 500 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("mv_fo_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileName: rawFileName } = await context.params
    const fallbackName =
      decodeURIComponent(rawFileName || config.fallbackFileName) || config.fallbackFileName

    let upstream: UpstreamResult
    try {
      upstream = await fetchUpstream(config.buildUpstreamUrl(apiBase, id), token)
    } catch (err) {
      console.error("[pdf-preview-proxy] upstream request failed:", err)
      return NextResponse.json({ error: "Failed to reach PDF service" }, { status: 502 })
    }

    if (upstream.status < 200 || upstream.status >= 300) {
      return NextResponse.json(
        { error: "Failed to generate PDF preview" },
        { status: upstream.status },
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
        return NextResponse.json({ error: "Invalid PDF response" }, { status: 502 })
      }
      const base64 = String(raw.fileBase64 ?? raw.data ?? "")
      if (!base64) {
        return NextResponse.json({ error: "Empty PDF response" }, { status: 502 })
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
