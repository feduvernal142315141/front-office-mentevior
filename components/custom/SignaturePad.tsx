"use client"

import { useRef, useEffect, useCallback, useState, type MouseEvent, type TouchEvent } from "react"
import { cn } from "@/lib/utils"
import { SIGNATURE_CANVAS_CONFIG } from "@/lib/constants/credentials.constants"

interface SignaturePadProps {
  width?: number
  height?: number
  lineWidth?: number
  strokeColor?: string
  disabled?: boolean
  onDrawStart?: () => void
  onDrawEnd?: () => void
  className?: string
}

export interface SignaturePadRef {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: (type?: string) => string
}

export function SignaturePad({
  width = SIGNATURE_CANVAS_CONFIG.width,
  height = SIGNATURE_CANVAS_CONFIG.height,
  lineWidth = SIGNATURE_CANVAS_CONFIG.lineWidth,
  strokeColor = SIGNATURE_CANVAS_CONFIG.strokeColor,
  disabled = false,
  onDrawStart,
  onDrawEnd,
  className,
}: SignaturePadProps & { ref?: React.Ref<SignaturePadRef> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const hasDrawnRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineWidth = lineWidth
    ctx.lineCap = SIGNATURE_CANVAS_CONFIG.lineCap
    ctx.strokeStyle = strokeColor
  }, [lineWidth, strokeColor])

  const getPointerPosition = (
    event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ("touches" in event) {
      const touch = event.touches[0] || event.changedTouches[0]
      if (!touch) return null
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (
    event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const point = getPointerPosition(event)
    if (!ctx || !point) return

    isDrawingRef.current = true
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    onDrawStart?.()
  }

  const draw = (event: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const point = getPointerPosition(event)
    if (!ctx || !point) return

    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true
      setHasDrawn(true)
    }
  }

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      onDrawEnd?.()
    }
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasDrawnRef.current = false
    setHasDrawn(false)
  }, [])

  const isEmpty = useCallback(() => {
    return !hasDrawnRef.current
  }, [])

  const toDataURL = useCallback((type: string = "image/png") => {
    const canvas = canvasRef.current
    if (!canvas) return ""
    return canvas.toDataURL(type)
  }, [])

  return {
    canvasProps: {
      ref: canvasRef,
      width,
      height,
      className: cn(
        "rounded-lg border border-gray-200 bg-white touch-none",
        disabled && "opacity-60 cursor-not-allowed",
        className
      ),
      onMouseDown: startDrawing,
      onMouseMove: draw,
      onMouseUp: stopDrawing,
      onMouseLeave: stopDrawing,
      onTouchStart: startDrawing,
      onTouchMove: draw,
      onTouchEnd: stopDrawing,
    },
    clear,
    isEmpty,
    toDataURL,
    hasDrawn,
  }
}

export function useSignaturePad(props?: Omit<SignaturePadProps, "className">) {
  return SignaturePad(props || {})
}
