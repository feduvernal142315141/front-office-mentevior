"use client"

interface TagListProps {
  items: string[]
  /** Cuántos chips se ven antes del "+N"; el resto queda en el tooltip */
  max?: number
}

/** Lista corta de chips para celdas de tabla: no deja que una lista larga estire la fila */
export function TagList({ items, max = 2 }: TagListProps) {
  if (items.length === 0) return <span className="text-slate-400">—</span>

  const visible = items.slice(0, max)
  const hidden = items.length - visible.length

  return (
    <div className="flex flex-wrap items-center gap-1.5" title={items.join(", ")}>
      {visible.map((item) => (
        <span
          key={item}
          className="max-w-[180px] truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
        >
          {item}
        </span>
      ))}
      {hidden > 0 && (
        <span className="rounded-md bg-[#037ECC]/10 px-2 py-0.5 text-xs font-semibold text-[#037ECC]">
          +{hidden}
        </span>
      )}
    </div>
  )
}
