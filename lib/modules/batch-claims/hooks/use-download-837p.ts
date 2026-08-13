"use client"

import { useCallback, useState } from "react"
import { toast } from "@/lib/compat/sonner"
import { getBatchClaim837P } from "../services/batch-claims.service"

interface UseDownload837PReturn {
  download: (batchClaimId: string) => Promise<boolean>
  isDownloading: boolean
}

/**
 * Generates the X12 837P on the backend and saves it locally as a .dat file.
 * The backend does not upload it to the clearing house — the user submits it manually.
 */
export function useDownload837P(): UseDownload837PReturn {
  const [isDownloading, setIsDownloading] = useState(false)

  const download = useCallback(async (batchClaimId: string) => {
    setIsDownloading(true)
    try {
      const { fileName, fileBase64 } = await getBatchClaim837P(batchClaimId)

      const binary = atob(fileBase64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      const blob = new Blob([bytes], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)

      toast.success("837P file downloaded")
      return true
    } catch (err) {
      // El 422 trae el motivo real (falta config EDI, póliza de dependiente, etc.)
      toast.error(err instanceof Error ? err.message : "Failed to generate the 837P file")
      return false
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return { download, isDownloading }
}
