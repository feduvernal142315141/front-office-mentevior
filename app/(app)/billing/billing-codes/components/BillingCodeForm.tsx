"use client"

import { FormProvider } from "react-hook-form"
import { useBillingCodeForm } from "../hooks/useBillingCodeForm"
import { BillingCodeFormFields } from "./BillingCodeFormFields"
import { BillingCodeFormSkeleton } from "./BillingCodeFormSkeleton"

interface BillingCodeFormProps {
  billingCodeId?: string | null
}

export function BillingCodeForm({ billingCodeId = null }: BillingCodeFormProps) {
  const {
    form,
    mode,
    isEditing,
    isLoadingBillingCode,
    onSubmit,
    isSubmitting,
    placesOfService,
    isLoadingPlaces,
    parentOptions,
    isLoadingParents,
    actions,
  } = useBillingCodeForm({ billingCodeId })

  if (isEditing && isLoadingBillingCode) {
    return <BillingCodeFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <BillingCodeFormFields
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
          placesOfService={placesOfService}
          isLoadingPlaces={isLoadingPlaces}
          parentOptions={parentOptions}
          isLoadingParents={isLoadingParents}
        />
      </form>
    </FormProvider>
  )
}
