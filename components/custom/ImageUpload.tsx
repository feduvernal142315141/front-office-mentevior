"use client"

import { useState, useEffect } from "react"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  label?: string
  value: string // base64 or URL
  onChange: (base64: string) => void
  required?: boolean
  hasError?: boolean
  disabled?: boolean
  maxSizeMB?: number
}

export function ImageUpload({
  label = "Company Logo",
  value,
  onChange,
  required = false,
  hasError = false,
  disabled = false,
  maxSizeMB = 1,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof value === "string" && (value.startsWith("data:image") || value.startsWith("https") || value.startsWith("http"))) {
      setPreview(value)
    } else {
      setPreview(null)
    }
  }, [value])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLocalError(null)

    const validTypes = ["image/png", "image/jpeg", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      setLocalError("Only PNG or JPG files are allowed.")
      setPreview(null)
      onChange("")
      return
    }

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      setLocalError(`The logo must be less than ${maxSizeMB}MB.`)
      setPreview(null)
      onChange("")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setPreview(base64)
      onChange(base64)
    }
    reader.onerror = () => {
      setLocalError("Error reading file")
    }
    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    setPreview(null)
    onChange("")
    setLocalError(null)
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-[#037ECC]">*</span>}
        </p>
      )}

      {!preview ? (
        <label
          htmlFor="logo-upload"
          className={cn(
            `
            flex flex-col items-center justify-center 
            w-full h-42 2xl:h-45 rounded-xl cursor-pointer
            border-2 border-dashed
            bg-gray-50/40
            hover:border-[#037ECC] hover:bg-[#037ECC]/5
            transition-all duration-200 group
            `,
            (hasError || localError)
              ? "border-red-500 bg-red-50/50 text-red-500"
              : "border-gray-300",
            disabled && "opacity-50 cursor-not-allowed hover:border-gray-300 hover:bg-gray-50/40"
          )}
        >
          <Upload className="w-10 h-10 mb-3 text-slate-400 group-hover:text-[#037ECC] transition-colors" />
          <p className="text-sm font-medium text-slate-700">Click to upload</p>
          <p className="text-xs mt-1 text-slate-500">PNG or JPG (max {maxSizeMB}MB)</p>

          <input
            id="logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleUpload}
            disabled={disabled}
          />
        </label>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full h-29 2xl:h-31 rounded-xl overflow-hidden border-2 border-gray-200 bg-white shadow-sm">
            <img 
              src={preview} 
              className="w-full h-full object-contain p-4" 
              alt="Company logo preview"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='176' height='176'%3E%3Crect width='176' height='176' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='48' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E"
              }}
            />

            {!disabled && (
              <button
                type="button"
                onClick={clearLogo}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 hover:shadow-lg transition-all group"
              >
                <X className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
              </button>
            )}
          </div>

          {!disabled && (
            <label
              htmlFor="logo-upload-change"
              className="
                block w-full text-center px-4 py-2.5 
                rounded-xl border-2 border-[#037ECC] bg-white
                text-sm font-medium text-[#037ECC]
                hover:bg-[#037ECC]/5 hover:border-[#079CFB]
                transition-all cursor-pointer
              "
            >
              Change Logo
            </label>
          )}

          <input
            id="logo-upload-change"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleUpload}
            disabled={disabled}
          />
        </div>
      )}

      {(hasError || localError) && (
        <p className="text-sm text-red-600 font-medium pt-1">
          {localError || "Invalid image"}
        </p>
      )}
    </div>
  )
}
