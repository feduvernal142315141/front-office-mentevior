"use client"

import { useEffect } from "react"

import { startOverlayLockWatchdog } from "@/lib/utils/overlay-lock"

/**
 * Evita que la app quede sin cursor ni clicks después de cerrar un modal.
 * El porqué está explicado en `lib/utils/overlay-lock.ts`.
 */
export function OverlayLockWatchdog() {
  useEffect(() => startOverlayLockWatchdog(), [])
  return null
}
