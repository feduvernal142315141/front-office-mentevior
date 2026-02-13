"use client"

import { FormProvider } from "react-hook-form"
import { useUserForm } from "../hooks/useUserForm"
import { UserFormSkeleton } from "./UserFormSkeleton"
import { UserFormFields } from "./UserFormFields"
import { useAuth } from "@/lib/hooks/use-auth"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"

interface UserFormProps {
  userId?: string | null
}

export function UserForm({ userId = null }: UserFormProps) {
  const { user: authUser } = useAuth()
  // Fetch full user data from API (like Topbar does) to get role as object with .name
  const { user: fullCurrentUser } = useUserById(authUser?.id || null)
  
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

  // Merge auth user (has id, email, permissions) with full user (has role as object)
  const currentUser = fullCurrentUser
    ? { ...authUser, id: authUser?.id, role: fullCurrentUser.role }
    : authUser

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
