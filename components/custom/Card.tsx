import { cn } from "@/lib/utils"
import React from "react"

type CardVariant = "elevated" | "outlined" | "flat" | "glass"
type CardPadding = "none" | "sm" | "md" | "lg" | "xl"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante visual del card
   * - elevated: Con sombra y elevación (default)
   * - outlined: Solo borde, sin sombra
   * - flat: Sin borde ni sombra
   * - glass: Efecto glassmorphism
   */
  variant?: CardVariant
  
  /**
   * Padding interno
   * - none: Sin padding
   * - sm: 12px
   * - md: 16px (default)
   * - lg: 24px
   * - xl: 32px
   */
  padding?: CardPadding
  
  /**
   * Si tiene hover effect
   */
  hoverable?: boolean
  
  /**
   * Si es clickeable (cursor pointer + hover más pronunciado)
   */
  clickable?: boolean
  
  /**
   * Header del card (opcional)
   */
  header?: React.ReactNode
  
  /**
   * Footer del card (opcional)
   */
  footer?: React.ReactNode
  
  /**
   * Icono o decoración en la esquina superior izquierda
   */
  icon?: React.ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  elevated: `
    bg-white 
    border border-gray-100
    shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
    hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]
  `,
  
  outlined: `
    bg-white 
    border border-gray-200
    shadow-none
    hover:border-gray-300
  `,
  
  flat: `
    bg-gray-50/50
    border-none
    shadow-none
  `,
  
  glass: `
    bg-white/60
    backdrop-blur-md
    border border-white/20
    shadow-[0_8px_32px_rgba(0,0,0,0.08)]
    hover:bg-white/70
  `,
}

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
}

export function Card({
  variant = "elevated",
  padding = "md",
  hoverable = false,
  clickable = false,
  header,
  footer,
  icon,
  className,
  children,
  ...props
}: CardProps) {
  const hasHeader = !!header || !!icon
  const hasFooter = !!footer
  
  return (
    <div
      {...props}
      className={cn(
        // Base styles
        "rounded-xl overflow-hidden",
        "transition-all duration-300 ease-out",
        
        // Variant
        variantStyles[variant],
        
        // Padding (solo si no hay header/footer, sino se aplica a cada sección)
        !hasHeader && !hasFooter && paddingStyles[padding],
        
        // Hover effect
        hoverable && "hover:scale-[1.02]",
        
        // Clickable
        clickable && [
          "cursor-pointer",
          "active:scale-[0.98]",
          variant === "elevated" && "hover:shadow-[0_12px_32px_rgba(0,0,0,0.12),0_6px_12px_rgba(0,0,0,0.06)]",
        ],
        
        className
      )}
    >
      {/* Header Section */}
      {hasHeader && (
        <div
          className={cn(
            "border-b border-gray-100",
            paddingStyles[padding],
            "bg-gradient-to-b from-gray-50/50 to-transparent"
          )}
        >
          {icon ? (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                {header}
              </div>
            </div>
          ) : (
            header
          )}
        </div>
      )}
      
      {/* Content Section */}
      <div className={cn(
        hasHeader || hasFooter ? paddingStyles[padding] : ""
      )}>
        {children}
      </div>
      
      {/* Footer Section */}
      {hasFooter && (
        <div
          className={cn(
            "border-t border-gray-100",
            paddingStyles[padding],
            "bg-gray-50/30"
          )}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

/**
 * Card.Header - Componente helper para headers consistentes
 */
Card.Header = function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  )
}

/**
 * Card.Section - Componente helper para secciones internas del card
 */
Card.Section = function CardSection({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || icon) && (
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900">
              {title}
            </h4>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  )
}

/**
 * Card.Grid - Layout helper para grid de cards
 */
Card.Grid = function CardGrid({
  children,
  cols = 1,
  className,
}: {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  className?: string
}) {
  const colsClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[cols]
  
  return (
    <div className={cn("grid gap-6", colsClass, className)}>
      {children}
    </div>
  )
}
