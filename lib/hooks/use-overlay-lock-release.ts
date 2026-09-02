"use client"

import { useCallback, useEffect, useRef } from "react"

import { scheduleOverlayLockRelease } from "@/lib/utils/overlay-lock"

/**
 * Avisa al guard de `lib/utils/overlay-lock.ts` cada vez que un overlay se cierra, para
 * que revise si quedó un `pointer-events: none` sin dueño en el `<body>`.
 *
 * Cubre las tres formas de cerrar: bajando la prop `open` desde fuera, el cierre interno
 * de Radix (Escape, click en el overlay, botón de cerrar) y el desmontaje del componente
 * con el overlay todavía abierto.
 *
 * Devuelve el `onOpenChange` que hay que pasarle a la primitiva.
 */
export function useOverlayLockRelease(
  open: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
): (open: boolean) => void {
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    scheduleOverlayLockRelease()
  }, [open])

  useEffect(
    () => () => {
      if (!wasOpenRef.current) return
      wasOpenRef.current = false
      scheduleOverlayLockRelease()
    },
    [],
  )

  return useCallback(
    (next: boolean) => {
      // Los overlays sin `open` controlado sólo se enteran por acá
      if (!next) scheduleOverlayLockRelease()
      onOpenChange?.(next)
    },
    [onOpenChange],
  )
}
