"use client"

import { FormProvider } from "react-hook-form"
import { useUserForm } from "../hooks/useUserForm"
import { UserFormSkeleton } from "./UserFormSkeleton"
import { UserSuccessScreen } from "./UserSuccessScreen"
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
    response,
    uiState,
    actions,
  } = useUserForm({ userId })

  // Loading state
  if (isEditing && isLoadingUser) {
    return <UserFormSkeleton />
  }

  // Success state (only for create mode)
  if (response && uiState.showPassword && !isEditing) {
    return (
      <UserSuccessScreen
        email={response.email}
        countdown={uiState.redirectCountdown}
        onCreateAnother={actions.createAnother}
        onGoToList={actions.goToList}
      />
    )
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
