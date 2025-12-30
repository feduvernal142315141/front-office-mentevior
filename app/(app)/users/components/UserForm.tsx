"use client"

import { FormProvider } from "react-hook-form"
import { useUserForm } from "../hooks/useUserForm"
import { UserFormSkeleton } from "./UserFormSkeleton"
import { UserFormFields } from "./UserFormFields"

interface UserFormProps {
  userId?: string | null
}

export function UserForm({ userId = null }: UserFormProps) {
  const {
    form,
    mode,
    isEditing,
    roles,
    isLoadingRoles,
    isLoadingUser,
    onSubmit,
    isSubmitting,
    actions,
  } = useUserForm({ userId })

  // Loading state
  if (isEditing && isLoadingUser) {
    return <UserFormSkeleton />
  }

  // Form state
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <UserFormFields
          isEditing={isEditing}
          roles={roles}
          isLoadingRoles={isLoadingRoles}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
        />
      </form>
    </FormProvider>
  )
}
