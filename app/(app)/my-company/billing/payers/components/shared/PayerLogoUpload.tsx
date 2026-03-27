"use client"

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react"
import { Upload, X, AlertCircle, ImageIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const MAX_SIZE_MB = 1
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"])

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? result)
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

interface PayerLogoUploadProps {
  /** Raw base64 string (no prefix) — form value */
  value: string
  onChange: (base64: string) => void
  /** Existing logo URL from API (for edit mode display) */
  existingLogoUrl?: string | null
  /** Title when showing existing / catalog preview (default: "Current logo") */
  existingTitle?: string
  /** Shown under the title when displaying existingLogoUrl (e.g. "From catalog") */
  existingHint?: string
  /** Called when the user removes the logo — parent can clear catalog preview state */
  onClear?: () => void
  error?: string
  readOnly?: boolean
}

export function PayerLogoUpload({
  value,
  onChange,
  existingLogoUrl,
  existingTitle = "Current logo",
  existingHint,
  onClear,
  error,
  readOnly,
}: PayerLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null)
  const [imageReady, setImageReady] = useState(false)

  useEffect(() => {
    if (!existingLogoUrl) {
      setFetchedLogoUrl(null)
      return
    }
    setFetchedLogoUrl(existingLogoUrl)
  }, [existingLogoUrl])

  const displaySrc = previewObjectUrl ?? fetchedLogoUrl
  const logoImgRef = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    if (!displaySrc) {
      setImageReady(false)
      return
    }
    setImageReady(false)
    const img = logoImgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setImageReady(true)
    }
  }, [displaySrc])

  const handleFileChange = useCallback(async (file: File) => {
    setFileError(null)

    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      setFileError("Only image files are allowed (JPG, PNG, GIF, WEBP).")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Image exceeds the ${MAX_SIZE_MB}MB size limit.`)
      return
    }

    try {
      const base64 = await readFileAsBase64(file)
      const objectUrl = URL.createObjectURL(file)
      setPreviewObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return objectUrl
      })
      onChange(base64)
    } catch {
      setFileError("Failed to process the image. Please try again.")
    }
  }, [onChange])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (readOnly) return
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileChange(file)
    },
    [handleFileChange, readOnly]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileChange(file)
      e.target.value = ""
    },
    [handleFileChange]
  )

  const handleRemove = useCallback(() => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl)
      setPreviewObjectUrl(null)
    }
    setFetchedLogoUrl(null)
    onChange("")
    setFileError(null)
    onClear?.()
  }, [previewObjectUrl, onChange, onClear])

  const hasNewUpload = Boolean(previewObjectUrl)
  const hasExisting = Boolean(fetchedLogoUrl) && !hasNewUpload
  const hasImage = Boolean(displaySrc)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">Logo</p>

      {hasImage && displaySrc ? (
        <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-blue-100 bg-white">
            {!imageReady && (
              <Skeleton className="absolute inset-0 h-full w-full rounded-xl border-0" />
            )}
            <img
              ref={logoImgRef}
              src={displaySrc}
              alt="Payer logo"
              className={cn(
                "h-full w-full object-contain",
                !imageReady && "opacity-0",
              )}
              onLoad={() => setImageReady(true)}
              onError={() => setImageReady(true)}
            />
          </div>
          <div className="min-w-0 flex-1">
            {!imageReady ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">
                  {hasNewUpload ? "Logo uploaded" : existingTitle}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {readOnly
                    ? "View only"
                    : hasExisting && existingHint
                      ? existingHint
                      : `Images only — max ${MAX_SIZE_MB}MB`}
                </p>
              </>
            )}
          </div>
          {!readOnly && imageReady && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  "border border-slate-200 bg-white transition-all duration-200",
                  "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                )}
                title="Change logo"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  "border border-slate-200 bg-white transition-all duration-200",
                  "text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500",
                )}
                title="Remove logo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : readOnly ? (
        <div className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border border-slate-200 bg-slate-50/80">
          <ImageIcon className="w-8 h-8 text-slate-400" />
          <p className="text-sm text-slate-500">No logo on file</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-8",
            "rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
            dragOver
              ? "border-[#037ECC] bg-[#037ECC]/5 scale-[1.01]"
              : "border-slate-200 hover:border-[#037ECC]/50 hover:bg-slate-50/70"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-[#037ECC]/10 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-[#037ECC]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Drop your logo here or{" "}
              <span className="text-[#037ECC] hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              JPG, PNG, GIF, WEBP — max {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      )}

      {!readOnly && (
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp"
          onChange={handleInputChange}
        />
      )}

      {(fileError || error) && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {fileError ?? error}
        </div>
      )}
    </div>
  )
}
