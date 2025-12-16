"use client"

import { cn } from "@/lib/utils"
import React from "react"

type Variant = "primary" | "secondary" | "ghost" | "danger"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: `
    bg-gradient-to-r from-blue-600 to-blue-500 
    text-white 
    hover:from-blue-500 hover:to-blue-400
    active:from-blue-700 active:to-blue-600
    shadow-[0_4px_18px_rgba(37,99,235,0.35)]
    dark:bg-gradient-to-r dark:from-blue-500 dark:to-blue-400
    dark:hover:from-blue-400 dark:hover:to-blue-300 
    dark:shadow-[0_4px_16px_rgba(37,99,235,0.45)]
  `,

  secondary: `
    bg-white text-slate-700 
    border border-slate-300 
    hover:bg-slate-50 
    active:bg-slate-100
    shadow-[0_2px_8px_rgba(0,0,0,0.06)]
    
    dark:bg-slate-800 dark:text-slate-200 
    dark:border-slate-700 
    dark:hover:bg-slate-700/60 
    dark:active:bg-slate-700
    dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]
  `,

  ghost: `
    text-slate-600 
    hover:bg-slate-100 
    active:bg-slate-200
    
    dark:text-slate-300 
    dark:hover:bg-slate-700/40 
    dark:active:bg-slate-700
  `,

  danger: `
    bg-red-600 text-white 
    hover:bg-red-500 
    active:bg-red-700
    shadow-[0_4px_15px_rgba(220,38,38,0.35)]
    
    dark:bg-red-500 
    dark:hover:bg-red-400
    dark:shadow-[0_4px_15px_rgba(220,38,38,0.45)]
  `,
}

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        `
        px-6 h-11 rounded-xl font-medium text-sm 
        transition-all duration-300 
        cursor-pointer 
        select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        
        /* Animación premium */
        active:scale-[0.97]
        hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]
        dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.45)]
        
        animate-in fade-in-0 zoom-in-95
      `,
        variantStyles[variant],
        className
      )}
    >
      {loading ? (
        <span className="animate-pulse opacity-80">Loading...</span>
      ) : (
        children
      )}
    </button>
  )
}
