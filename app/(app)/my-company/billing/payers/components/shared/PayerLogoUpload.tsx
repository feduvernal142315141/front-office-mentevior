"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Upload, X, AlertCircle, ImageIcon, Loader2 } from "lucide-react"
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
  error?: string
  readOnly?: boolean
}

export function PayerLogoUpload({ value, onChange, existingLogoUrl, error, readOnly }: PayerLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)
  const [fetchedLogoUrl, setFetchedLogoUrl] = useState<string | null>(null)
  const [isLoadingLogo, setIsLoadingLogo] = useState(false)

  // Load the signed S3 URL when existingLogoUrl changes (same pattern as required documents)
  useEffect(() => {
    if (!existingLogoUrl) {
      setFetchedLogoUrl(null)
      return
    }
    setIsLoadingLogo(true)
    // The logoUrl from getById is already a fresh signed URL — use directly
    setFetchedLogoUrl(existingLogoUrl)
    setIsLoadingLogo(false)
  }, [existingLogoUrl])

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
  }, [previewObjectUrl, onChange])

  const displaySrc = previewObjectUrl ?? fetchedLogoUrl
  const hasNewUpload = Boolean(previewObjectUrl)
  const hasExisting = Boolean(fetchedLogoUrl) && !hasNewUpload
  const hasImage = Boolean(displaySrc)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">Logo</p>

      {isLoadingLogo ? (
        <div className="flex items-center justify-center p-6 rounded-xl border border-slate-200 bg-slate-50">
          <Loader2 className="w-5 h-5 text-[#037ECC] animate-spin" />
        </div>
      ) : hasImage && displaySrc ? (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-blue-100 bg-white flex-shrink-0">
            <img
              src={displaySrc}
              alt="Payer logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {hasNewUpload ? "Logo uploaded" : "Current logo"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {readOnly ? "View only" : `Images only — max ${MAX_SIZE_MB}MB`}
            </p>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  "bg-white hover:bg-slate-50 border border-slate-200",
                  "text-slate-500 hover:text-slate-700 transition-all duration-200"
                )}
                title="Change logo"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  "bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200",
                  "text-slate-400 hover:text-red-500 transition-all duration-200"
                )}
                title="Remove logo"
              >
                <X className="w-4 h-4" />
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
