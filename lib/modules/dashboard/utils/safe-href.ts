/**
 * `href` es el único campo del contrato del dashboard que el backend elige y el
 * front ejecuta: termina siendo el destino de un `<a>`. Aceptarlo tal cual abre
 * dos agujeros —`javascript:...` y dominios externos disfrazados de acción
 * interna— así que sólo pasan rutas absolutas de este mismo front.
 *
 * Se aplica en el normalizador, no en los widgets: si un `href` no sirve, la
 * fila tiene que nacer sin enlace, no descubrirlo al pintarse.
 */
export function toInternalHref(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined

  const trimmed = value.trim()
  if (!trimmed.startsWith("/")) return undefined

  // `//evil.com` es una URL protocol-relative, no una ruta: el navegador la
  // resuelve como dominio externo. `/\evil.com` lo normalizan igual varios.
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return undefined

  return trimmed
}

const UUID_BODY = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
const UUID = new RegExp(`^${UUID_BODY}$`, "i")

/** `/clients/<uuid>` a secas, con o sin barra final */
const BARE_CLIENT_ROUTE = new RegExp(`^/clients/(${UUID_BODY})/?$`, "i")

/** Pasos del wizard de perfil que el dashboard sabe enlazar */
export type ClientProfileStep = "priorAuth" | "documents"

/**
 * Ruta al paso del perfil donde se resuelve el pendiente.
 *
 * Apunta al paso y no a la portada a propósito: llegar a "Personal Information"
 * a buscar la pestaña correcta no es haber llegado.
 */
export function clientProfileHref(clientId: string, step: ClientProfileStep): string {
  return `/clients/${clientId}/profile?step=${step}`
}

/**
 * Resuelve el destino de una fila que se atiende dentro del perfil de un cliente.
 *
 * Desde el contrato del 2026-08-07 el backend ya manda la ruta correcta, así que
 * el camino normal es devolver su `href` tal cual. Quedan dos redes:
 *
 * 1. Si el `href` falta o no es una ruta interna usable, se arma desde `clientId`
 *    —que ahora viene como campo propio—. Antes no había de dónde sacarlo.
 * 2. Si llega `/clients/<uuid>` a secas, se reescribe. Esa forma **no es una
 *    página de esta app** (el cliente se abre en `/profile`, `/configuration` o
 *    `/edit`) y era el 404 que se veía en producción. Se conserva porque cuesta
 *    una línea y el costo de equivocarse lo paga el usuario con un enlace roto.
 */
export function toClientHref(
  value: unknown,
  step: ClientProfileStep,
  clientId?: string,
): string | undefined {
  const href = toInternalHref(value)

  if (!href) {
    return clientId && UUID.test(clientId) ? clientProfileHref(clientId, step) : undefined
  }

  const bare = BARE_CLIENT_ROUTE.exec(href)
  return bare ? clientProfileHref(bare[1], step) : href
}
