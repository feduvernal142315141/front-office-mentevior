import { BRAND } from "./tokens"

interface SparklineProps {
  points: number[]
  /** Color del último punto y del trazo activo */
  accent?: string
  className?: string
}

const WIDTH = 120
const HEIGHT = 32
const PADDING = 3

/**
 * Sparkline de 12 puntos en SVG.
 *
 * Trazo en el gris de de-énfasis con el período actual en el acento — la marca
 * de 2px y el punto final de 8px vienen de las especificaciones de marca; se
 * dibuja a mano en vez de traer una librería porque una polilínea de 12 puntos
 * no justifica el peso ni la pérdida de control sobre el trazo.
 */
export function Sparkline({ points, accent = BRAND.primary, className }: SparklineProps) {
  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1

  const innerWidth = WIDTH - PADDING * 2
  const innerHeight = HEIGHT - PADDING * 2

  const coords = points.map((value, index) => {
    const x = PADDING + (index / (points.length - 1)) * innerWidth
    const y = PADDING + innerHeight - ((value - min) / span) * innerHeight
    return { x, y }
  })

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${HEIGHT} L${coords[0].x.toFixed(1)},${HEIGHT} Z`
  const last = coords[coords.length - 1]
  const gradientId = `spark-${accent.replace("#", "")}`

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Anillo de superficie de 2px para que el punto no se funda con el trazo */}
      <circle cx={last.x} cy={last.y} r={4} fill="#fff" />
      <circle cx={last.x} cy={last.y} r={2.5} fill={accent} />
    </svg>
  )
}
