import type { NextRequest } from "next/server"

export const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.dev.mentevior.com"

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "origin",
  "referer",
  "transfer-encoding",
  "keep-alive",
  "te",
  "trailer",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
])

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "proxy-authenticate",
  "proxy-connection",
  "te",
  "trailer",
  "upgrade",
])

export function buildBackendUrl(pathSegments: string[], search: string): string {
  const path = pathSegments.map(encodeURIComponent).join("/")
  const base = BACKEND_API_URL.replace(/\/$/, "")
  return `${base}/${path}${search}`
}

export function buildProxyRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers()

  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  return headers
}

export function buildProxyResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers()

  upstream.forEach((value, key) => {
    if (HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  return headers
}

export async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[],
): Promise<Response> {
  const targetUrl = buildBackendUrl(pathSegments, request.nextUrl.search)
  const headers = buildProxyRequestHeaders(request)

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer()
  }

  const upstream = await fetch(targetUrl, init)
  const responseHeaders = buildProxyResponseHeaders(upstream.headers)

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}
