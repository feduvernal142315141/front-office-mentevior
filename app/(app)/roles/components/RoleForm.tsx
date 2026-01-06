
"use client"

import { FormProvider, Controller } from "react-hook-form"
import { useRoleForm } from "../hooks/useRoleForm"
import { PermissionsSelector } from "@/components/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {  Save, Users, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/custom/Button"
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
    hasPermissions,
    hasChanges,
    isFormValid,
    actions,
  } = useRoleForm({ roleId })

  const roleNameRef = useRef<HTMLDivElement>(null)

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-6xl mx-auto space-y-8">

        <div className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div ref={roleNameRef} className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Role Name <span className="text-[#037ECC]">*</span>
                </label>
               
                <input
                  type="text"
                  placeholder="e.g. RBT, Supervisor, Clinical Admin"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={!canEditName && isEditing}
                  autoComplete="off"
                  className={`
                    w-full px-4 py-3 
                    text-base font-medium text-slate-900
                    bg-white
                    border-2 rounded-xl
                    transition-all duration-200
                    placeholder:text-slate-400 placeholder:font-normal
                    ${fieldState.error 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                      : 'border-slate-200 focus:border-[#037ECC] focus:ring-4 focus:ring-[#037ECC]/10'
                    }
                    ${!canEditName && isEditing ? 'opacity-60 cursor-not-allowed' : ''}
                    hover:border-slate-300
                  `}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    {fieldState.error.message}
                  </p>
                )}
                {!canEditName && isEditing && (
                  <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    This role is assigned to <strong>{usersCount}</strong> user(s) and cannot be renamed
                  </p>
                )}
              </div>
            )}
          />
          
          {isEditing && usersCount > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <Users className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Active Role</AlertTitle>
              <AlertDescription className="text-blue-800">
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
            <div className="flex items-center justify-end gap-4">
              {/* Validation message */}
              {!hasPermissions && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Select at least one permission to {isEditing ? "update" : "create"} the role
                </p>
              )}
              {isEditing && hasPermissions && !hasChanges && (
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  No changes detected
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
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
                  disabled={isSubmitting || !isFormValid}
                  loading={isSubmitting}
                  className="gap-2 flex items-center"
                >
                  {!isSubmitting && <Save className="w-4 h-4" />}
                  {isEditing ? "Update Role" : "Create Role"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
