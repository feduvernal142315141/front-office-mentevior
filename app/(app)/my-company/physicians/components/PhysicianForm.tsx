"use client"

import { FormProvider } from "react-hook-form"
import { usePhysicianForm } from "../hooks/usePhysicianForm"
import { PhysicianFormFields } from "./PhysicianFormFields"
import { FormBottomBar } from "@/components/custom/FormBottomBar"

interface PhysicianFormProps {
  physicianId?: string
}

export function PhysicianForm({ physicianId }: PhysicianFormProps) {
  const { 
    form, 
    onSubmit, 
    handleCancel, 
    isSubmitting, 
    isLoading, 
    isEditing,
    countries,
    states,
    physicianTypes,
    physicianSpecialties,
    isLoadingCountries,
    isLoadingStates,
    isLoadingPhysicianTypes,
    isLoadingPhysicianSpecialties,
  } = usePhysicianForm({ physicianId })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading physician...</p>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="pb-24">
        <PhysicianFormFields 
          isEditing={isEditing}
          countries={countries}
          states={states}
          physicianTypes={physicianTypes}
          physicianSpecialties={physicianSpecialties}
          isLoadingCountries={isLoadingCountries}
          isLoadingStates={isLoadingStates}
          isLoadingPhysicianTypes={isLoadingPhysicianTypes}
          isLoadingPhysicianSpecialties={isLoadingPhysicianSpecialties}
        />

        <FormBottomBar
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitText={isEditing ? "Update physician" : "Create physician"}
        />
      </form>
    </FormProvider>
  )
}
