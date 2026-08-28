"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { BatchClaim } from "@/lib/types/batch-claim.types"
import { getBatchClaimById } from "../services/batch-claims.service"
import { getBatchDecision } from "../claim-md-status"

/** Sondeo rápido durante el primer minuto y luego espaciado. */
const FAST_INTERVAL_MS = 4_000
const SLOW_INTERVAL_MS = 10_000
const FAST_WINDOW_MS = 60_000
/**
 * Corte duro. Un sondeo infinito contra un backend colgado es peor que un botón de
 * refrescar: consume batería y da la sensación de que la pantalla está viva cuando no lo está.
 */
const MAX_POLL_MS = 5 * 60_000

interface UseBatchClaimByIdOptions {
  /** Activa el sondeo mientras la transmisión de Claim.MD siga en curso. */
  poll?: boolean
}

interface UseBatchClaimByIdReturn {
  batchClaim: BatchClaim | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  /** Hay un sondeo activo ahora mismo. */
  isPolling: boolean
  /** Se alcanzó `MAX_POLL_MS` sin que la transmisión terminara. */
  pollTimedOut: boolean
}

export function useBatchClaimById(
  batchClaimId: string | null,
  options?: UseBatchClaimByIdOptions,
): UseBatchClaimByIdReturn {
  const poll = options?.poll ?? false

  const [batchClaim, setBatchClaim] = useState<BatchClaim | null>(null)
  const [isLoading, setIsLoading] = useState(!!batchClaimId)
  const [error, setError] = useState<Error | null>(null)
  const [pollTimedOut, setPollTimedOut] = useState(false)

  /** Descarta respuestas de peticiones que ya quedaron obsoletas. */
  const requestRef = useRef(0)
  const pollStartedAtRef = useRef<number | null>(null)

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!batchClaimId) {
        setBatchClaim(null)
        setIsLoading(false)
        return
      }

      const requestId = ++requestRef.current
      // Un refresco de sondeo no debe hacer parpadear la pantalla entera.
      if (!options?.silent) setIsLoading(true)
      setError(null)

      try {
        const data = await getBatchClaimById(batchClaimId)
        if (requestRef.current !== requestId) return
        setBatchClaim(data)
      } catch (err) {
        if (requestRef.current !== requestId) return
        setError(err instanceof Error ? err : new Error("Failed to fetch batch claim"))
        if (!options?.silent) setBatchClaim(null)
      } finally {
        if (requestRef.current === requestId && !options?.silent) setIsLoading(false)
      }
    },
    [batchClaimId],
  )

  const refetch = useCallback(async () => {
    pollStartedAtRef.current = null
    setPollTimedOut(false)
    await load()
  }, [load])

  useEffect(() => {
    void load()
  }, [load])

  const shouldPoll =
    poll && !pollTimedOut && getBatchDecision(batchClaim?.claimMdTransmissionStatus).shouldPoll

  useEffect(() => {
    if (!shouldPoll) {
      pollStartedAtRef.current = null
      return
    }

    if (pollStartedAtRef.current === null) {
      pollStartedAtRef.current = Date.now()
    }

    let timeoutId: number | null = null

    const tick = () => {
      const startedAt = pollStartedAtRef.current ?? Date.now()
      const elapsed = Date.now() - startedAt

      if (elapsed >= MAX_POLL_MS) {
        setPollTimedOut(true)
        return
      }

      // Con la pestaña en segundo plano el navegador ya estrangula los timers; no
      // tiene sentido pedir datos que nadie está mirando.
      if (typeof document !== "undefined" && document.hidden) {
        timeoutId = window.setTimeout(tick, SLOW_INTERVAL_MS)
        return
      }

      void load({ silent: true })
      timeoutId = window.setTimeout(tick, elapsed < FAST_WINDOW_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS)
    }

    timeoutId = window.setTimeout(tick, FAST_INTERVAL_MS)

    // Al volver a la pestaña se refresca de inmediato en vez de esperar al siguiente tick.
    const onVisible = () => {
      if (!document.hidden) void load({ silent: true })
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [shouldPoll, load])

  return { batchClaim, isLoading, error, refetch, isPolling: shouldPoll, pollTimedOut }
}
