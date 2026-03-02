"use client"

import { FormProvider } from "react-hook-form"
import { useClientForm } from "../hooks/useClientForm"
import { ClientFormSkeleton } from "./ClientFormSkeleton"
import { ClientFormFields } from "./ClientFormFields"

interface ClientFormProps {
  clientId?: string | null
  onSuccess?: (clientId: string) => void
}

export function ClientForm({ clientId = null, onSuccess }: ClientFormProps) {
  const {
    form,
    isEditing,
    isLoadingClient,
    onSubmit,
    isSubmitting,
    actions,
  } = useClientForm({ clientId, onSuccess })

  if (isEditing && isLoadingClient) {
    return <ClientFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <ClientFormFields
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
          editingClientId={clientId || undefined}
        />
      </form>
    </FormProvider>
  )
}
