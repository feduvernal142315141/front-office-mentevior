"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { ImageUpload } from "@/components/custom/ImageUpload"

interface AccountProfileFormFieldsProps {
  isSubmitting: boolean
  onCancel: () => void
}

export function AccountProfileFormFields({
  isSubmitting,
  onCancel,
}: AccountProfileFormFieldsProps) {
  const { control } = useFormContext()

  return (
    <>
      <div className="pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="space-y-6">
              <Controller
                name="legalName"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Legal name"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      hasError={!!fieldState.error}
                      autoComplete="organization"
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
                name="agencyEmail"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Agency Email"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      type="email"
                      hasError={!!fieldState.error}
                      autoComplete="email"
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
                name="phoneNumber"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Phone number"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      type="tel"
                      hasError={!!fieldState.error}
                      autoComplete="tel"
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
                name="fax"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Fax"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      type="tel"
                      hasError={!!fieldState.error}
                      autoComplete="tel"
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
                name="webSite"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Website"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      type="url"
                      hasError={!!fieldState.error}
                      autoComplete="url"
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
                  <div>
                    <FloatingInput
                      label="Employer Identification Number (EIN)"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      hasError={!!fieldState.error}
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

            <div className="space-y-6">
              <Controller
                name="npi"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="National Provider ID (NPI)"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      hasError={!!fieldState.error}
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
                  <div>
                    <FloatingInput
                      label="Medicaid/Medicare Provider ID (MPI)"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      hasError={!!fieldState.error}
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
                name="taxonomyCode"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Taxonomy Code"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      hasError={!!fieldState.error}
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
                name="logo"
                control={control}
                render={({ field, fieldState }) => (
                  <ImageUpload
                    label="Company Logo"
                    value={field.value || ""}
                    onChange={field.onChange}
                    hasError={!!fieldState.error}
                    disabled={isSubmitting}
                    maxSizeMB={1}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText="Save Changes"
      />
    </>
  )
}
