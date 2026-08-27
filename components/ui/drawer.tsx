'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cn } from '@/lib/utils'

/**
 * vaul@0.9 sólo restaura `document.body.style.pointerEvents` cuando el drawer se
 * cierra *desde adentro* (Escape, click en el overlay o `DrawerClose`), porque el
 * reset vive en el `onChange` de su `useControllableState`. Si el padre baja la
 * prop `open` a `false` de forma programática — por ejemplo al terminar de guardar —
 * ese `onChange` nunca corre y el `pointer-events: none` que puso Radix se queda
 * pegado en el `<body>`: la página entera deja de responder a los clicks.
 *
 * Lo restauramos nosotros al terminar la animación de cierre, y sólo si no quedó
 * otro overlay modal abierto que legítimamente lo necesite.
 */
const CLOSE_TRANSITION_MS = 550

function releaseBodyPointerEvents() {
  if (typeof document === 'undefined') return
  if (document.body.style.pointerEvents !== 'none') return
  // Otro dialog/drawer modal sigue abierto: es suyo el bloqueo, no lo tocamos.
  if (document.querySelector('[data-vaul-drawer][data-state="open"], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) {
    return
  }
  document.body.style.removeProperty('pointer-events')
}

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  const { open } = props
  const wasOpenRef = React.useRef(false)

  React.useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false

    const timeout = window.setTimeout(releaseBodyPointerEvents, CLOSE_TRANSITION_MS)
    return () => window.clearTimeout(timeout)
  }, [open])

  // Si el drawer se desmonta estando abierto, el reset de vaul tampoco llega.
  React.useEffect(
    () => () => {
      if (wasOpenRef.current) {
        wasOpenRef.current = false
        window.setTimeout(releaseBodyPointerEvents, CLOSE_TRANSITION_MS)
      }
    },
    []
  )

  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          'fixed z-50 flex h-full flex-col bg-background shadow-xl',
          // Bottom
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0',
          'data-[vaul-drawer-direction=bottom]:max-h-[85vh] data-[vaul-drawer-direction=bottom]:rounded-t-xl',
          // Top
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0',
          'data-[vaul-drawer-direction=top]:max-h-[85vh] data-[vaul-drawer-direction=top]:rounded-b-xl',
          // Right
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0',
          'data-[vaul-drawer-direction=right]:w-full',
          'md:data-[vaul-drawer-direction=right]:w-[50vw]',
          'lg:data-[vaul-drawer-direction=right]:w-[40vw]',
          'xl:data-[vaul-drawer-direction=right]:w-[40vw]',
          'data-[vaul-drawer-direction=right]:border-l',
          // Left
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0',
          'data-[vaul-drawer-direction=left]:w-full md:data-[vaul-drawer-direction=left]:w-[50vw]',
          'data-[vaul-drawer-direction=left]:border-r',
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'border-b px-6 py-5',
        'flex flex-col gap-1',
        className,
      )}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function DrawerBody({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-body"
      className={cn(
        'flex-1 overflow-y-auto px-6 py-6',
        className,
      )}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        'border-t px-6 py-4',
        'flex items-center justify-end gap-3',
        className,
      )}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
