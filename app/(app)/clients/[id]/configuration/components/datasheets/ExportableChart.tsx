"use client"

import { useCallback, useRef, useState } from "react"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "@/lib/compat/sonner"
import { DocumentViewer } from "@/components/custom/DocumentViewer"
import { exportElementToPdf } from "@/lib/utils/export-to-pdf"

interface ExportableChartProps {
  /** Nombre del item, impreso arriba de la gráfica en el PDF */
  itemName: string
  /** Rango visible (ej. "Nov 22 – Nov 28, 2026"), también impreso en el PDF */
  rangeLabel: string
  /** Nombre del archivo PDF al descargar */
  fileName: string
  children: React.ReactNode
}

/**
 * Envuelve solo la gráfica (sin la grilla del datasheet ni los controles de rango) y agrega
 * Export PDF debajo. El PDF se arma con el mismo motor que el resto de la pantalla.
 */
export function ExportableChart({ itemName, rangeLabel, fileName, children }: ExportableChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleExport = useCallback(async () => {
    if (!chartRef.current || isExporting) return
    setIsExporting(true)
    try {
      const url = await exportElementToPdf(chartRef.current, {
        fileName,
        orientation: "landscape",
        singlePage: true,
      })
      setPdfUrl(url)
    } catch (err) {
      console.error("Export chart PDF error:", err)
      toast.error("Failed to generate PDF")
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, fileName])

  return (
    <div className="space-y-3">
      <div ref={chartRef} className="space-y-2 bg-white">
        <div className="px-1">
          <p className="text-sm font-semibold text-slate-800">{itemName}</p>
          <p className="text-xs text-slate-400">{rangeLabel}</p>
        </div>
        {children}
      </div>

      <div className="flex justify-end" data-html2canvas-ignore>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#037ECC]/30 bg-[#037ECC]/5 text-sm font-medium text-[#037ECC] hover:bg-[#037ECC]/10 transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {isExporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>

      {pdfUrl && (
        <DocumentViewer
          open
          onClose={() => {
            URL.revokeObjectURL(pdfUrl)
            setPdfUrl(null)
          }}
          documentUrl={pdfUrl}
          fileName={fileName}
        />
      )}
    </div>
  )
}
