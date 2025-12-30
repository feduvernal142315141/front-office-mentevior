"use client"

import { cn } from "@/lib/utils"
import { Search, X } from "lucide-react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onClear?: () => void
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  onClear,
}: SearchInputProps) {
  const handleClear = () => {
    onChange("")
    onClear?.()
  }

  return (
    <div className={cn("relative w-full group", className)}>
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <Search className="w-[18px] h-[18px] text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
      </div>

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          `
            w-full
            h-[52px] 2xl:h-[56px]
            pl-12 pr-12
            rounded-[16px]
            text-[15px] 2xl:text-[16px]
            
            /* Premium background gradient */
            bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]
            
            /* Border suave */
            border border-[hsl(240_20%_88%/0.6)]
            
            /* Color del texto */
            text-[var(--color-login-text-primary)]
            
            /* Sombras equivalentes */
            shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]
            
            /* Transiciones */
            transition-all duration-200 ease-out
            
            /* Placeholder */
            placeholder:text-gray-400
            placeholder:transition-opacity
            placeholder:duration-160
            
            /* Hover */
            hover:border-[hsl(240_35%_75%/0.6)]
            hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_6px_rgba(15,23,42,0.06)]
            
            /* Focus */
            focus:outline-none
            focus:border-[hsl(var(--primary))]
            focus:bg-gradient-to-b focus:from-white focus:to-[hsl(240_20%_99%)]
            focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12),0_6px_14px_hsl(var(--primary)/0.18)]
            focus:-translate-y-[1px]
            focus:placeholder:opacity-25
          `
        )}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            `
              absolute right-3 top-1/2 -translate-y-1/2
              w-7 h-7
              flex items-center justify-center
              rounded-lg
              
              text-gray-400
              hover:text-gray-600
              hover:bg-gray-100
              
              transition-all duration-150
              
              opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
            `
          )}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
