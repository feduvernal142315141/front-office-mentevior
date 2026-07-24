import { request as httpsRequest } from "node:https"
import { request as httpRequest } from "node:http"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpstreamResult = {
  status: number
  contentType: string
  contentDisposition: string | null
  body: Buffer
}

/**
 * Fetch via node:http(s) instead of global fetch: the backend uses a
 * self-signed certificate (IP host) that undici rejects and cannot be
 * bypassed per-request without extra dependencies.
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
        // Backend uses a self-signed cert (same one users accept in the browser)
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

/** Parse filename from Content-Disposition (filename= / filename*=). */
function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null

  const utf8Match = /filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ""))
    } catch {
      // fall through
    }
  }

  const plainMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(header)
  if (plainMatch?.[2]) return plainMatch[2].trim()

  return null
}

/**
 * Same-origin PDF proxy so Chrome's built-in viewer uses a real filename
 * (from the URL path + Content-Disposition) instead of a blob: UUID.
 *
 * Example:
 * /api/reports/appointment-note/preview/Session%20Note.pdf?appointmentId=...
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ fileName: string }> },
) {
  const appointmentId = req.nextUrl.searchParams.get("appointmentId")
  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId is required" }, { status: 400 })
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
  const fallbackName = decodeURIComponent(rawFileName || "Session Note.pdf") || "Session Note.pdf"

  const upstreamUrl = `${apiBase}/reports/appointment-note/preview?appointmentId=${encodeURIComponent(appointmentId)}`

  let upstream: UpstreamResult
  try {
    upstream = await fetchUpstream(upstreamUrl, token)
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
  const resolvedName =
    parseContentDispositionFilename(upstream.contentDisposition) ?? fallbackName

  let pdfBuffer: Buffer

  if (upstreamType.includes("application/json") || upstreamType.includes("text/")) {
    // Legacy envelope: { fileBase64 } / { data }
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

  // `inline` keeps the PDF in the viewer; filename drives Chrome's Save As.
  const headers = new Headers()
  headers.set("Content-Type", "application/pdf")
  headers.set(
    "Content-Disposition",
    `inline; filename="${resolvedName.replace(/"/g, "")}"`,
  )
  headers.set("Cache-Control", "private, no-store")

  return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers })
}
