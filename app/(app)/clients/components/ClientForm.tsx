"use client"

import { FormProvider } from "react-hook-form"
import { useClientForm } from "../hooks/useClientForm"
import { ClientFormSkeleton } from "./ClientFormSkeleton"
import { ClientFormFields } from "./ClientFormFields"

interface ClientFormProps {
  clientId?: string | null
}

export function ClientForm({ clientId = null }: ClientFormProps) {
  const {
    form,
    isEditing,
    insurances,
    rbts,
    isLoadingRbts,
    isLoadingClient,
    onSubmit,
    isSubmitting,
    actions,
  } = useClientForm({ clientId })

  if (isEditing && isLoadingClient) {
    return <ClientFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <ClientFormFields
          isEditing={isEditing}
          insurances={insurances}
          rbts={rbts}
          isLoadingRbts={isLoadingRbts}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
        />
      </form>
    </FormProvider>
  )
}
