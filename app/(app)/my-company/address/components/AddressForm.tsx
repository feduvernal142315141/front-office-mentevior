"use client"

import { FormProvider } from "react-hook-form"
import { useAddressForm } from "../hooks/useAddressForm"
import { AddressFormFields } from "./AddressFormFields"
import { AddressFormSkeleton } from "./AddressFormSkeleton"

interface AddressFormProps {
  addressId?: string | null
}

export function AddressForm({ addressId = null }: AddressFormProps) {
  const {
    form,
    mode,
    isEditing,
    isLoadingAddress,
    onSubmit,
    isSubmitting,
    countries,
    states,
    isLoadingCountries,
    isLoadingStates,
    actions,
  } = useAddressForm({ addressId })

  if (isEditing && isLoadingAddress) {
    return <AddressFormSkeleton />
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AddressFormFields
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onCancel={actions.goToList}
          countries={countries}
          states={states}
          isLoadingCountries={isLoadingCountries}
          isLoadingStates={isLoadingStates}
        />
      </form>
    </FormProvider>
  )
}
