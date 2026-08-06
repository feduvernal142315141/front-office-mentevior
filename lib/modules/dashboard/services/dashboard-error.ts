import { parseApiErrorMessage } from "@/lib/utils/api-error-message"

/**
 * Errores del dashboard, tipados.
 *
 * El contrato define tres fallos con causas distintas —`400` scope inválido,
 * `401` sin sesión, `403` usuario sin compañía— y cada uno pide una respuesta
 * distinta del usuario. Un `Error` genérico los aplana a "algo salió mal", que
 * es justo lo que hace que la gente abandone un dashboard: no sabe si esperar,
 * reintentar o llamar a alguien.
 */
export type DashboardErrorKind =
  | "unauthorized"
  | "forbidden"
  | "bad-request"
  | "offline"
  | "server"
  | "unknown"

export class DashboardError extends Error {
  readonly kind: DashboardErrorKind
  readonly status: number | null
  /** Encabezado corto para la tarjeta de error */
  readonly title: string
  /** Reintentar tiene sentido; en `forbidden` no arregla nada */
  readonly canRetry: boolean
  /** Texto crudo del servidor cuando no es presentable (stack, SQL, excepción) */
  readonly technicalDetail?: string

  constructor(params: {
    kind: DashboardErrorKind
    status: number | null
    title: string
    message: string
    canRetry: boolean
    technicalDetail?: string
  }) {
    super(params.message)
    this.name = "DashboardError"
    this.kind = params.kind
    this.status = params.status
    this.title = params.title
    this.canRetry = params.canRetry
    this.technicalDetail = params.technicalDetail
  }
}

/**
 * ¿El texto es un volcado del servidor en vez de un mensaje para una persona?
 *
 * Caso real que lo motivó: un `400` con
 * `"No parameter named ':cancelledStatusId' in query with named parameters […]
 * ON EntityManagerFactoryUtils.java LINE 371"`. El contrato reserva el `400`
 * para un `scope` inválido, así que el mensaje del servidor se mostraba tal
 * cual — una excepción de Hibernate en la cara del usuario clínico.
 *
 * Un fallo así no lo puede resolver quien lo lee: se le muestra qué pasó y se
 * guarda el detalle para quien sí puede.
 */
const TECHNICAL_MARKERS = [
  /\.java\b/i,
  /\bexception\b/i,
  /\borg\.(springframework|hibernate|apache)\b/i,
  /\bcom\.[a-z]+\.[a-z]+\./i,
  /\bnamed parameters?\b/i,
  /\bstack ?trace\b/i,
  /\bSELECT\b.+\bFROM\b/i,
  /\bnull ?pointer\b/i,
  /\bat [\w.$]+\([\w.]+:\d+\)/,
]

export function looksTechnical(message: string): boolean {
  return TECHNICAL_MARKERS.some((marker) => marker.test(message))
}

/**
 * Traduce la respuesta de error del backend —`{ code, message, details }`— a un
 * `DashboardError`. El texto del servidor gana cuando dice algo concreto; el
 * fallback sólo entra cuando el backend no explica nada.
 */
export function dashboardErrorFromResponse(status: number | null, data: unknown): DashboardError {
  const fallbackByStatus: Record<number, { title: string; message: string }> = {
    400: {
      title: "We couldn't read that request",
      message: "The dashboard asked for an unknown scope. Reload the page to try again.",
    },
    401: {
      title: "Your session expired",
      message: "Sign in again to see your dashboard.",
    },
    403: {
      title: "Your user isn't linked to a company",
      message:
        "The dashboard needs a company to pull data from. Ask an administrator to link your account.",
    },
  }

  if (status === null) {
    return new DashboardError({
      kind: "offline",
      status: null,
      title: "We couldn't reach the server",
      message: "Check your connection and try again.",
      canRetry: true,
    })
  }

  const fallback = fallbackByStatus[status]
  const genericMessage = fallback?.message ?? "The dashboard service didn't respond as expected."
  const { description: rawDescription } = parseApiErrorMessage(data, genericMessage)

  // Lo técnico no se muestra: se guarda aparte y en pantalla va la versión legible.
  const isTechnical = looksTechnical(rawDescription)
  const description = isTechnical ? genericMessage : rawDescription
  const technicalDetail = isTechnical ? rawDescription : undefined

  switch (status) {
    case 400:
      // El contrato reserva el `400` para un `scope` inválido —cosa que el front
      // no puede provocar—. Si el cuerpo trae una excepción, el fallo es del
      // servidor armando la consulta, y reintentar sí puede servir cuando lo
      // arreglen: no obliga a recargar la app entera.
      return isTechnical
        ? new DashboardError({
            kind: "server",
            status,
            title: "The dashboard couldn't be built",
            message:
              "The server failed while assembling this report. It's not something you can fix from here — please pass this on to the team.",
            canRetry: true,
            technicalDetail,
          })
        : new DashboardError({
            kind: "bad-request",
            status,
            title: fallback.title,
            message: description,
            canRetry: false,
          })
    case 401:
      return new DashboardError({
        kind: "unauthorized",
        status,
        title: fallback.title,
        message: description,
        canRetry: false,
        technicalDetail,
      })
    case 403:
      return new DashboardError({
        kind: "forbidden",
        status,
        title: fallback.title,
        message: description,
        // Reintentar no cambia nada: hace falta que alguien asocie la compañía.
        canRetry: false,
        technicalDetail,
      })
    default:
      return new DashboardError({
        kind: status >= 500 ? "server" : "unknown",
        status,
        title: "We couldn't load your dashboard",
        message: description,
        canRetry: true,
        technicalDetail,
      })
  }
}

/** El `catch` de la UI recibe `unknown`; esto lo normaliza sin perder el tipo. */
export function toDashboardError(error: unknown): DashboardError {
  if (error instanceof DashboardError) return error

  return new DashboardError({
    kind: "unknown",
    status: null,
    title: "We couldn't load your dashboard",
    message: error instanceof Error ? error.message : "Unexpected error.",
    canRetry: true,
  })
}
