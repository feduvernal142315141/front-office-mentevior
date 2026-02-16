"use client"

import { Controller, useFormContext } from "react-hook-form"
import { CollapsableSection } from "@/components/custom/CollapsableSection"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { Briefcase } from "lucide-react"

export function ProfessionalInformationSection() {
  const { control } = useFormContext()

  return (
    <CollapsableSection
      title="Professional Information"
      subtitle="Credentials and professional details"
      icon={<Briefcase className="w-4 h-4" />}
      defaultOpen={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Controller
          name="npi"
          control={control}
          render={({ field, fieldState }) => (
            <div data-field="npi">
              <FloatingInput
                label="National Provider ID (NPI)"
                name="npi"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="mpi"
          control={control}
          render={({ field, fieldState }) => (
            <div data-field="mpi">
              <FloatingInput
                label="Medicaid / Medicare Number (MPI)"
                name="mpi"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="caqhNumber"
          control={control}
          render={({ field, fieldState }) => (
            <div data-field="caqhNumber">
              <FloatingInput
                label="CAQH Number"
                name="caqhNumber"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="companyName"
          control={control}
          render={({ field, fieldState }) => (
            <div data-field="companyName">
              <FloatingInput
                label="Company Name"
                name="companyName"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="ein"
          control={control}
          render={({ field, fieldState }) => (
            <div data-field="ein">
              <FloatingInput
                label="Employer Identification Number (EIN)"
                name="ein"
                value={field.value}
                onChange={(value) => {
                   const cleanValue = value.replace(/\D/g, "")
                   field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />

        <Controller
          name="employerId"
          control={control}
          render={({ field, fieldState }) => (
            <div data-field="employerId">
              <FloatingInput
                label="Employer ID"
                name="employerId"
                value={field.value}
                onChange={(value) => {
                  const cleanValue = value.replace(/\D/g, "")
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </div>
    </CollapsableSection>
  )
}
