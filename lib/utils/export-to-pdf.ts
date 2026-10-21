import html2canvas from "html2canvas-pro"
import { jsPDF } from "jspdf"

const EXPAND_ATTR = "data-pdf-expand"
const INPUT_ATTR = "data-pdf-input"
const CLIP_TEXT_ATTR = "data-pdf-clip-text"

interface ExportToPdfOptions {
  fileName?: string
  orientation?: "portrait" | "landscape"
  margin?: number
  /** Todo en una sola hoja: escala la captura para que quepa y elige la orientación que la deja más grande */
  singlePage?: boolean
}

interface InputSnapshot {
  text: string
  isPlaceholder: boolean
  width: number
  height: number
  textAlign: string
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
    singlePage = false,
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

  // html2canvas no soporta el texto con degradado (background-clip: text): pinta el degradado
  // como un rectángulo y el texto queda transparente. En la copia va en un color sólido.
  const clippedTexts = Array.from(element.querySelectorAll<HTMLElement>("*")).filter((el) => {
    const style = window.getComputedStyle(el)
    return style.backgroundClip === "text" || style.getPropertyValue("-webkit-background-clip") === "text"
  })
  const GRADIENT_COLOR = /(rgba?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|#[0-9a-f]{3,8}\b)/i
  clippedTexts.forEach((el) => {
    // El primer color del degradado conserva el tono (azul de marca, verde de logro…)
    const firstColor = window.getComputedStyle(el).backgroundImage.match(GRADIENT_COLOR)?.[1]
    el.setAttribute(CLIP_TEXT_ATTR, firstColor ?? "#037ECC")
  })

  // html2canvas dibuja el texto de los <input> desplazado hacia abajo: en la copia se
  // cambian por un bloque del mismo tamaño con el valor centrado.
  const inputs = Array.from(element.querySelectorAll<HTMLInputElement>("input, textarea"))
  const inputSnapshots: InputSnapshot[] = inputs.map((input, index) => {
    input.setAttribute(INPUT_ATTR, String(index))
    const value = input.value
    return {
      text: value || input.placeholder || "",
      isPlaceholder: !value,
      width: input.offsetWidth,
      height: input.offsetHeight,
      textAlign: window.getComputedStyle(input).textAlign,
    }
  })

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
        clonedElement.querySelectorAll<HTMLElement>(`[${CLIP_TEXT_ATTR}]`).forEach((el) => {
          el.style.backgroundImage = "none"
          el.style.backgroundColor = "transparent"
          el.style.color = el.getAttribute(CLIP_TEXT_ATTR) || "#037ECC"
        })
        clonedElement.querySelectorAll<HTMLElement>(`[${INPUT_ATTR}]`).forEach((el) => {
          const snapshot = inputSnapshots[Number(el.getAttribute(INPUT_ATTR))]
          if (!snapshot || el.getAttribute("type") === "checkbox" || el.getAttribute("type") === "radio") return
          const box = el.ownerDocument.createElement("div")
          box.className = el.className
          box.textContent = snapshot.text
          Object.assign(box.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: snapshot.textAlign === "center" ? "center" : snapshot.textAlign === "right" ? "flex-end" : "flex-start",
            boxSizing: "border-box",
            width: `${snapshot.width}px`,
            height: `${snapshot.height}px`,
            lineHeight: "1",
            overflow: "hidden",
            whiteSpace: "nowrap",
          })
          if (snapshot.isPlaceholder) box.style.color = "#94A3B8"
          el.replaceWith(box)
        })
      },
    })
  } finally {
    scrollables.forEach((el) => el.removeAttribute(EXPAND_ATTR))
    inputs.forEach((input) => input.removeAttribute(INPUT_ATTR))
    clippedTexts.forEach((el) => el.removeAttribute(CLIP_TEXT_ATTR))
  }

  const imgData = canvas.toDataURL("image/png")

  if (singlePage) {
    // A4 en mm; la orientación que deje la captura más grande es la que se usa
    const fitScale = (w: number, h: number) =>
      Math.min((w - margin * 2) / canvas.width, (h - margin * 2) / canvas.height)
    const pageOrientation = fitScale(297, 210) >= fitScale(210, 297) ? "landscape" : "portrait"
    const pdf = new jsPDF({ orientation: pageOrientation, unit: "mm", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const scale = fitScale(pageWidth, pageHeight)
    const width = canvas.width * scale
    const height = canvas.height * scale
    pdf.addImage(imgData, "PNG", (pageWidth - width) / 2, margin, width, height)
    return URL.createObjectURL(pdf.output("blob"))
  }

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
