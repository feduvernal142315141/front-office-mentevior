
"use client"

import { FormProvider, Controller } from "react-hook-form"
import { useRoleForm } from "../hooks/useRoleForm"
import { PermissionsSelector } from "@/components/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Save, Users, Shield, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { useRef, useEffect } from "react"


function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-6">

        <Card
          variant="elevated"
          padding="lg"
          header={
            <Card.Header
              title="Role Information"
              subtitle="Basic details for this role"
              icon={
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-700" />
                </div>
              }
            />
          }
        >
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
                {!canEditName && isEditing ? (
                  <p className="text-sm text-gray-600 mt-2">
                    This role is assigned to {usersCount} user(s) and cannot be renamed
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">
                    Must be unique within your company
                  </p>
                )}
              </div>
            )}
          />
          
          {isEditing && usersCount > 0 && (
            <Alert className="mt-4">
              <Users className="h-4 w-4" />
              <AlertTitle>Role In Use</AlertTitle>
              <AlertDescription>
                This role is currently assigned to <strong>{usersCount}</strong> user(s).
                Permission changes will apply immediately to all users with this role.
              </AlertDescription>
            </Alert>
          )}
        </Card>

        <Card
          variant="elevated"
          padding="lg"
          header={
            <Card.Header
              title="Module Capabilities"
              subtitle="Define what users with this role can do"
              icon={
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-700" />
                </div>
              }
            />
          }
        >
          <PermissionsSelector name="permissions" />
        </Card>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-900">Permission Changes</AlertTitle>
          <AlertDescription className="text-blue-800">
            {isEditing ? (
              <>
                Changes to permissions will take effect immediately for all users with this role.
                Users may need to refresh their browser to see updated access.
              </>
            ) : (
              <>
                Users assigned this role will only see and access the modules and actions
                you select here. Modules without any permissions will not appear in their menu.
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="h-24" />

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto px-6 py-4">
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
