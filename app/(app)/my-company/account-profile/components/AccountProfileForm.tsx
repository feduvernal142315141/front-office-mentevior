"use client"

import { FormProvider } from "react-hook-form"
import { useAccountProfileForm } from "../hooks/useAccountProfileForm"
import { AccountProfileFormFields } from "./AccountProfileFormFields"
import { AccountProfileFormSkeleton } from "./AccountProfileFormSkeleton"

export function AccountProfileForm() {
  const {
    form,
    isLoadingData,
    isSubmitting,
    onSubmit,
    actions,
  } = useAccountProfileForm()

  if (isLoadingData) {
    return <AccountProfileFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AccountProfileFormFields
          isSubmitting={isSubmitting}
          onCancel={actions.cancel}
        />
      </form>
    </FormProvider>
  )
}
