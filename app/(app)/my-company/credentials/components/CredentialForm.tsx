"use client"

import { FormProvider } from "react-hook-form"
import { useCredentialForm } from "../hooks/useCredentialForm"
import { CredentialFormFields } from "./CredentialFormFields"
import { CredentialFormSkeleton } from "./CredentialFormSkeleton"

interface CredentialFormProps {
  credentialId?: string | null
}

export function CredentialForm({ credentialId = null }: CredentialFormProps) {
  const {
    form,
    isEditing,
    isLoadingCredential,
    onSubmit,
    isSubmitting,
    billingCodeOptions = [],
    isLoadingBillingCodes,
    actions,
  } = useCredentialForm({ credentialId })

  if (isEditing && isLoadingCredential) {
    return <CredentialFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CredentialFormFields
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
          billingCodeOptions={billingCodeOptions}
          isLoadingBillingCodes={isLoadingBillingCodes}
        />
      </form>
    </FormProvider>
  )
}
