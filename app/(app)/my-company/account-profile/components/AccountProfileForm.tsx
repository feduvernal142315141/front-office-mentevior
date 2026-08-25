"use client"

import { FormProvider } from "react-hook-form"
import { useAccountProfileForm } from "../hooks/useAccountProfileForm"
import { AccountProfileFormFields } from "./AccountProfileFormFields"
import { AccountProfileFormSkeleton } from "./AccountProfileFormSkeleton"
import { useModulePermissions } from "@/lib/hooks/use-module-permissions"
import { PermissionModule } from "@/lib/utils/permissions-new"

export function AccountProfileForm() {
  const { canEdit } = useModulePermissions(PermissionModule.ACCOUNT_PROFILE)
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
          canEdit={canEdit}
        />
      </form>
    </FormProvider>
  )
}
