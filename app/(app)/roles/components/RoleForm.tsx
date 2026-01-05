
"use client"

import { FormProvider, Controller } from "react-hook-form"
import { useRoleForm } from "../hooks/useRoleForm"
import { PermissionsSelector } from "@/components/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Save, Users, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { useRef, useEffect } from "react"


function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}


interface RoleFormProps {
  roleId?: string | null
}

export function RoleForm({ roleId = null }: RoleFormProps) {
  const {
    form,
    isEditing,
    isLoadingRole,
    canEditName,
    usersCount,
    onSubmit,
    isSubmitting,
    actions,
  } = useRoleForm({ roleId })

  const roleNameRef = useRef<HTMLDivElement>(null)

  // Scroll to name field if there's an error
  useEffect(() => {
    if (form.formState.errors.name && roleNameRef.current) {
      roleNameRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  }, [form.formState.errors.name])

  if (isEditing && isLoadingRole) {
    return <FormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-6xl mx-auto space-y-6">

        {/* Role Name - Simple, no card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div ref={roleNameRef}>
                <FloatingInput
                  label="Role Name"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  hasError={!!fieldState.error}
                  type="text"
                  autoComplete="off"
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
                {!canEditName && isEditing && (
                  <p className="text-xs text-slate-500 mt-2">
                    ⚠️ This role is assigned to {usersCount} user(s) and cannot be renamed
                  </p>
                )}
              </div>
            )}
          />
          
          {isEditing && usersCount > 0 && (
            <Alert className="mt-4 bg-amber-50 border-amber-200">
              <Users className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Active Role</AlertTitle>
              <AlertDescription className="text-amber-800">
                <strong>{usersCount}</strong> user(s) currently have this role. Permission changes apply immediately.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Permissions */}
        <PermissionsSelector name="permissions" />

        <div className="h-20" />

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_16px_rgba(15,23,42,0.08)]">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={actions.goToList}
                disabled={isSubmitting}
                className="gap-2 flex items-center"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="gap-2 flex items-center"
              >
                {!isSubmitting && <Save className="w-4 h-4" />}
                {isEditing ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
