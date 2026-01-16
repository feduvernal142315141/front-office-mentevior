"use client"

import { FormProvider } from "react-hook-form"
import { useUserForm } from "../hooks/useUserForm"
import { UserFormSkeleton } from "./UserFormSkeleton"
import { UserFormFields } from "./UserFormFields"
import { useAuth } from "@/lib/hooks/use-auth"

interface UserFormProps {
  userId?: string | null
}

export function UserForm({ userId = null }: UserFormProps) {
  const { user: currentUser } = useAuth()
  
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
    user,
  } = useUserForm({ userId })

  if (isEditing && isLoadingUser) {
    return <UserFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <UserFormFields
          isEditing={isEditing}
          roles={roles}
          isLoadingRoles={isLoadingRoles}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
          currentUser={currentUser}
          editingUser={user}
        />
      </form>
    </FormProvider>
  )
}
