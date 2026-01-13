"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { FormBottomBar } from "@/components/custom/FormBottomBar"

interface CredentialFormFieldsProps {
  isEditing: boolean
  isSubmitting: boolean
  onCancel: () => void
  billingCodeOptions: { id: string; code: string; type: string }[]
  isLoadingBillingCodes: boolean
}

export function CredentialFormFields({
  isEditing,
  isSubmitting,
  onCancel,
  billingCodeOptions = [],
  isLoadingBillingCodes,
}: CredentialFormFieldsProps) {
  const { control } = useFormContext()

  return (
    <>
      <div className="pb-24">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8 space-y-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Name"
                      value={field.value || ""}
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
                name="shortName"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Short Name"
                      value={field.value || ""}
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
                name="organizationName"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Organization Name (Optional)"
                      value={field.value || ""}
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
                name="website"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Website (Optional)"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="https://example.com"
                      hasError={!!fieldState.error}
                      type="url"
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
                      value={field.value || ""}
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

              <div className="md:col-span-2">
                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingTextarea
                        label="Description (Optional)"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder=" "
                        hasError={!!fieldState.error}
                        rows={3}
                        maxLength={500}
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

              <div className="md:col-span-2">
                <Controller
                  name="billingCodeIds"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <MultiSelect
                        label="Allowed Billing Codes"
                        value={field.value || []}
                        onChange={field.onChange}
                        options={billingCodeOptions.map(bc => ({
                          value: bc.id,
                          label: `${bc.code} (${bc.type})`
                        }))}
                        placeholder="Select billing codes"
                        disabled={isLoadingBillingCodes}
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
            </div>
          </div>

        </div>
      </div>

      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isEditing ? "Update Credential" : "Create Credential"}
      />
    </>
  )
}
