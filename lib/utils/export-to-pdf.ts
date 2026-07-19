import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"

interface ExportToPdfOptions {
  fileName?: string
  orientation?: "portrait" | "landscape"
  margin?: number
}

/**
 * Captures a DOM element and generates a PDF blob URL.
 * Uses html2canvas-pro which supports modern CSS color functions (lab, oklch, oklab, lch).
 * Returns the blob URL ready to be displayed in DocumentViewer or downloaded.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportToPdfOptions = {},
): Promise<string> {
  const {
    orientation = "landscape",
    margin = 10,
  } = options

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: element.scrollWidth,
    height: element.scrollHeight,
    scrollX: 0,
    scrollY: -window.scrollY,
    allowTaint: true,
  })

  const imgData = canvas.toDataURL("image/png")
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = usableWidth / imgWidth
  const scaledHeight = imgHeight * ratio

  if (scaledHeight <= usableHeight) {
    pdf.addImage(imgData, "PNG", margin, margin, usableWidth, scaledHeight)
  } else {
    // Multi-page: slice the canvas into page-sized chunks
    const pageCanvasHeight = usableHeight / ratio
    let yOffset = 0
    let pageIndex = 0

    while (yOffset < imgHeight) {
      if (pageIndex > 0) pdf.addPage()

      const sliceHeight = Math.min(pageCanvasHeight, imgHeight - yOffset)
      const sliceCanvas = document.createElement("canvas")
      sliceCanvas.width = imgWidth
      sliceCanvas.height = sliceHeight

      const ctx = sliceCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(canvas, 0, -yOffset)
      }

      const sliceData = sliceCanvas.toDataURL("image/png")
      const sliceScaledHeight = sliceHeight * ratio
      pdf.addImage(sliceData, "PNG", margin, margin, usableWidth, sliceScaledHeight)

      yOffset += pageCanvasHeight
      pageIndex++
    }
  }

  const blob = pdf.output("blob")
  return URL.createObjectURL(blob)
}

/**
 * Captures a DOM element and directly downloads it as PDF.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: ExportToPdfOptions = {},
): Promise<void> {
  const { fileName = "export.pdf", orientation = "landscape", margin = 10 } = options
  const url = await exportElementToPdf(element, { orientation, margin })

  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
