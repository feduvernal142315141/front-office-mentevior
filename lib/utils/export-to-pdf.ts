import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"

const EXPAND_ATTR = "data-pdf-expand"

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

  // Los contenedores con scroll interno (p. ej. la grilla del datasheet) se capturarían
  // recortados: se marcan aquí y en la copia que usa html2canvas se abren completos,
  // sin tocar la pantalla real.
  const scrollables = Array.from(element.querySelectorAll<HTMLElement>("*")).filter((el) => {
    const { overflowX, overflowY } = window.getComputedStyle(el)
    const clipsX = overflowX !== "visible" && el.scrollWidth > el.clientWidth + 1
    const clipsY = overflowY !== "visible" && el.scrollHeight > el.clientHeight + 1
    return clipsX || clipsY
  })
  const extraWidth = scrollables.reduce((max, el) => Math.max(max, el.scrollWidth - el.clientWidth), 0)
  const captureWidth = element.offsetWidth + extraWidth
  scrollables.forEach((el) => el.setAttribute(EXPAND_ATTR, ""))

  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: Math.max(window.innerWidth, captureWidth + 64),
      scrollX: 0,
      scrollY: -window.scrollY,
      allowTaint: true,
      onclone: (_doc, clonedElement) => {
        if (extraWidth > 0) {
          clonedElement.style.width = `${captureWidth}px`
          clonedElement.style.maxWidth = "none"
        }
        clonedElement.querySelectorAll<HTMLElement>(`[${EXPAND_ATTR}]`).forEach((el) => {
          el.style.overflow = "visible"
          el.style.maxHeight = "none"
          el.style.height = "auto"
          el.style.maxWidth = "none"
        })
      },
    })
  } finally {
    scrollables.forEach((el) => el.removeAttribute(EXPAND_ATTR))
  }

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
