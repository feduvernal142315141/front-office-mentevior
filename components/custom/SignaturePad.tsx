"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import SignaturePadLib from "signature_pad"
import { cn } from "@/lib/utils"

interface UseSignaturePadOptions {
  minWidth?: number
  maxWidth?: number
  penColor?: string
  disabled?: boolean
  onDrawEnd?: () => void
}

interface UseSignaturePadReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  hasDrawn: boolean
  clear: () => void
  isEmpty: () => boolean
  toDataURL: (type?: string) => string
}

export function useSignaturePad(options?: UseSignaturePadOptions): UseSignaturePadReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const boundCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hasDrawn, setHasDrawn] = useState(false)
  const onDrawEndRef = useRef(options?.onDrawEnd)
  onDrawEndRef.current = options?.onDrawEnd

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Already bound to this exact canvas element — skip
    if (boundCanvasRef.current === canvas) return

    // Destroy previous pad if canvas changed
    if (padRef.current) {
      padRef.current.off()
      padRef.current = null
    }

    boundCanvasRef.current = canvas

    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.scale(ratio, ratio)

    const pad = new SignaturePadLib(canvas, {
      minWidth: options?.minWidth ?? 0.6,
      maxWidth: options?.maxWidth ?? 2.2,
      penColor: options?.penColor ?? "#0f172a",
      velocityFilterWeight: 0.7,
      throttle: 0,
    })

    pad.addEventListener("endStroke", () => {
      setHasDrawn(!pad.isEmpty())
      onDrawEndRef.current?.()
    })

    padRef.current = pad
  })

  useEffect(() => {
    const pad = padRef.current
    if (!pad) return
    if (options?.disabled) pad.off()
    else pad.on()
  }, [options?.disabled])

  const clear = useCallback(() => {
    padRef.current?.clear()
    setHasDrawn(false)
  }, [])

  const isEmpty = useCallback(() => padRef.current?.isEmpty() ?? true, [])

  const toDataURL = useCallback((type: string = "image/png") => {
    if (!padRef.current || padRef.current.isEmpty()) return ""
    return padRef.current.toDataURL(type)
  }, [])

  return { canvasRef, hasDrawn, clear, isEmpty, toDataURL }
}

// Legacy export — kept for backward compatibility with credentials signature
export function SignaturePad(props: UseSignaturePadOptions & { width?: number; height?: number; className?: string }) {
  const pad = useSignaturePad(props)
  return {
    canvasProps: {
      ref: pad.canvasRef,
      width: props.width ?? 820,
      height: props.height ?? 260,
      className: cn(
        "rounded-lg border border-gray-200 bg-white touch-none select-none",
        props.disabled ? "opacity-60 cursor-not-allowed" : "cursor-crosshair",
        props.className,
      ),
    },
    clear: pad.clear,
    isEmpty: pad.isEmpty,
    toDataURL: pad.toDataURL,
    hasDrawn: pad.hasDrawn,
  }
}
