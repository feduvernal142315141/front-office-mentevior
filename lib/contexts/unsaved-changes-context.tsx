"use client"

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react"
import { useAlert } from "@/lib/contexts/alert-context"

interface UnsavedChangesRegistration {
  isDirty: boolean
  onSave?: () => void | Promise<void>
}

interface UnsavedChangesContextValue {
  register: (registration: UnsavedChangesRegistration) => () => void
  guard: (action: () => void) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | undefined>(undefined)

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const alert = useAlert()
  const registrationRef = useRef<UnsavedChangesRegistration | null>(null)

  const register = useCallback((registration: UnsavedChangesRegistration) => {
    registrationRef.current = registration
    return () => {
      if (registrationRef.current === registration) registrationRef.current = null
    }
  }, [])

  const guard = useCallback(
    (action: () => void) => {
      const registration = registrationRef.current
      if (!registration?.isDirty) {
        action()
        return
      }

      alert.confirm({
        title: "Unsaved changes",
        description: "You have unsaved changes. Save them, discard them, or cancel to keep editing.",
        confirmText: "Save",
        discardText: "Discard",
        cancelText: "Cancel",
        onConfirm: async () => registration.onSave?.(),
        onDiscard: action,
      })
    },
    [alert],
  )

  return (
    <UnsavedChangesContext.Provider value={{ register, guard }}>
      {children}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChangesRegistration(registration: UnsavedChangesRegistration) {
  const context = useContext(UnsavedChangesContext)
  if (!context) throw new Error("useUnsavedChangesRegistration must be used within UnsavedChangesProvider")
  useEffect(() => context.register(registration), [context, registration])
  return { guard: context.guard }
}

export function useUnsavedChangesGuard() {
  const context = useContext(UnsavedChangesContext)
  if (!context) throw new Error("useUnsavedChangesGuard must be used within UnsavedChangesProvider")
  return { guard: context.guard }
}
