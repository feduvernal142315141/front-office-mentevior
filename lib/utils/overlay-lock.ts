/**
 * Radix bloquea la página poniendo `pointer-events: none` en el `<body>` mientras hay
 * un overlay modal abierto (`@radix-ui/react-dismissable-layer`) y sólo lo devuelve en
 * el cleanup de desmontaje de esa capa. Ese desmontaje depende de que la animación de
 * salida emita `animationend` —vaul inyecta `slideToRight` de 500 ms y nuestros diálogos
 * usan `animate-out`—, así que si la animación no llega a terminar, la capa se queda
 * montada e invisible y el bloqueo nunca se levanta: la página entera queda con el
 * cursor en flecha, sin hover y sin poder hacer click.
 *
 * Además se vuelve permanente. Radix guarda el valor previo del body en una variable de
 * módulo que sólo recaptura cuando no queda ninguna capa registrada, así que si el body
 * quedó en `none`, el siguiente modal captura `none` como "valor original" y lo restaura
 * al cerrarse. Desde ahí, cada modal vuelve a congelar la pantalla hasta recargar.
 *
 * Este módulo corta esa cadena: si el body está bloqueado y no hay ninguna capa
 * realmente abierta en el DOM, le devuelve el `pointer-events`.
 */

/**
 * Capas que sí tienen derecho a bloquear la página mientras están abiertas.
 *
 * Una capa que se quedó montada por una animación sin terminar lleva
 * `data-state="closed"` (Radix lo escribe con el `open` del contexto, no con el
 * desmontaje), así que no cuenta como abierta y no impide la liberación.
 */
const OPEN_LAYER_SELECTOR = [
  // Dialog, alert dialog, popover y los drawers de vaul
  '[data-state="open"][role="dialog"]',
  '[data-state="open"][role="alertdialog"]',
  '[data-state="open"][data-vaul-drawer]',
  // Select y dropdown menu, que también bloquean el fondo mientras están desplegados
  '[data-state="open"][role="listbox"]',
  '[data-state="open"][role="menu"]',
  // Red de seguridad para cualquier popper de Radix que no encaje en los roles de arriba
  '[data-radix-popper-content-wrapper]',
].join(', ')

/** Cubre la animación de salida más larga que tenemos, la de los drawers (500 ms). */
const CLOSE_GRACE_MS = 600
/** Tras un cambio de estilo del body basta con dejar pasar el commit que lo provocó. */
const STYLE_SETTLE_MS = 150
/**
 * Un segundo vistazo para el caso en que al cerrar un overlay todavía quedaba otro
 * desplegándose o desapareciendo encima. Alcanza con uno: si en ese momento sigue
 * habiendo una capa abierta, el bloqueo es legítimo.
 */
const CLOSE_RETRIES = 1

let closeTimer: number | null = null
let styleTimer: number | null = null

function isBodyLocked(): boolean {
  return document.body.style.pointerEvents === 'none'
}

function hasOpenLayer(): boolean {
  return document.querySelector(OPEN_LAYER_SELECTOR) !== null
}

/** Devuelve `false` sólo si el bloqueo sigue en pie y tiene dueño. */
function releaseIfOrphaned(): boolean {
  if (!isBodyLocked()) return true
  if (hasOpenLayer()) return false

  document.body.style.removeProperty('pointer-events')
  return true
}

function scheduleCloseCheck(retriesLeft: number): void {
  if (closeTimer !== null) window.clearTimeout(closeTimer)

  closeTimer = window.setTimeout(() => {
    closeTimer = null
    if (releaseIfOrphaned()) return
    if (retriesLeft > 0) scheduleCloseCheck(retriesLeft - 1)
  }, CLOSE_GRACE_MS)
}

/**
 * Revisa el bloqueo poco después de que un overlay empezó a cerrarse.
 *
 * Lo llaman los wrappers de `Dialog`, `AlertDialog`, `Sheet` y `Drawer`, que son los
 * únicos que saben que hubo un cierre: cuando la capa se queda montada no hay ningún
 * otro cambio en el DOM que pueda delatarlo ante el observador.
 */
export function scheduleOverlayLockRelease(): void {
  if (typeof document === 'undefined') return
  scheduleCloseCheck(CLOSE_RETRIES)
}

/**
 * Vigila el `<body>` durante toda la vida de la app. Cubre el caso en que Radix
 * restaura un `pointer-events: none` heredado, que es lo que hace permanente al bug.
 *
 * Devuelve la función para desmontarlo.
 */
export function startOverlayLockWatchdog(): () => void {
  if (typeof document === 'undefined') return () => {}

  const checkAfterStyleChange = () => {
    if (styleTimer !== null) window.clearTimeout(styleTimer)
    styleTimer = window.setTimeout(() => {
      styleTimer = null
      releaseIfOrphaned()
    }, STYLE_SETTLE_MS)
  }

  // El bloqueo puede venir arrastrado desde antes de montar el observador
  checkAfterStyleChange()

  const observer = new MutationObserver(() => {
    if (isBodyLocked()) checkAfterStyleChange()
  })
  observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })

  return () => {
    observer.disconnect()
    if (styleTimer !== null) window.clearTimeout(styleTimer)
    if (closeTimer !== null) window.clearTimeout(closeTimer)
    styleTimer = null
    closeTimer = null
  }
}
