"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseDirtyBaselineParams {
  /** `true` cuando los datos y los catálogos ya están cargados */
  ready: boolean
  /** Foto serializable del estado que hay que vigilar */
  snapshot: string
  /** Corre justo antes de tomar la foto (p.ej. `reset(getValues())` de react-hook-form) */
  onBaseline?: () => void
}

interface UseDirtyBaselineReturn {
  /** `false` hasta tomar la foto: evita el falso "cambios sin guardar" al abrir */
  isBaselineReady: boolean
  /** `true` cuando el snapshot actual difiere del de la foto */
  hasChanges: boolean
  /** Vuelve a tomar la foto — llamalo después de guardar */
  rebaseline: () => void
}

/**
 * Punto cero para detectar cambios sin guardar.
 *
 * Espera **dos frames** desde que `ready` pasa a `true` —lo que tardan los
 * Controllers y los selects en montarse contra sus defaults— y recién ahí toma
 * la foto. Sin esa espera todo formulario nace "sucio" y el aviso de cambios sin
 * guardar saltaría cada vez que se cierra un modal sin haber tocado nada.
 *
 * Es el patrón que ya usaba `ItemDetailPanel` a mano, extraído para que las
 * pantallas que suman el guard no lo reimplementen (ni se lo olviden).
 */
export function useDirtyBaseline({
  ready,
  snapshot,
  onBaseline,
}: UseDirtyBaselineParams): UseDirtyBaselineReturn {
  const [isBaselineReady, setIsBaselineReady] = useState(false)
  const baselineRef = useRef("")

  // Refs para leer el valor de hoy desde dentro del rAF sin re-disparar el efecto
  const snapshotRef = useRef(snapshot)
  snapshotRef.current = snapshot
  const onBaselineRef = useRef(onBaseline)
  onBaselineRef.current = onBaseline

  const rebaseline = useCallback(() => {
    onBaselineRef.current?.()
    baselineRef.current = snapshotRef.current
    setIsBaselineReady(true)
  }, [])

  useEffect(() => {
    if (!ready) {
      setIsBaselineReady(false)
      return
    }

    let cancelled = false
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (cancelled) return
        rebaseline()
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
      setIsBaselineReady(false)
    }
  }, [ready, rebaseline])

  return {
    isBaselineReady,
    hasChanges: isBaselineReady && snapshot !== baselineRef.current,
    rebaseline,
  }
}
