"use client"

import { FormProvider } from "react-hook-form"
import { useMyProfileForm } from "../hooks/useMyProfileForm"
import { MyProfileFormSkeleton } from "./MyProfileFormSkeleton"
import { MyProfileFormFields } from "./MyProfileFormFields"

export function MyProfileForm() {
  const {
    form,
    roles,
    isLoadingRoles,
    isLoadingUser,
    onSubmit,
    isSubmitting,
    actions,
  } = useMyProfileForm()

  if (isLoadingUser) {
    return <MyProfileFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <MyProfileFormFields
          roles={roles}
          isLoadingRoles={isLoadingRoles}
          isSubmitting={isSubmitting}
          onCancel={actions.goToDashboard}
        />
      </form>
    </FormProvider>
  )
}
