"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FormBottomBar } from "@/components/custom/FormBottomBar"

interface BillingCodeFormFieldsProps {
  isEditing: boolean
  isSubmitting: boolean
  onCancel: () => void
  placesOfService: { id: string; name: string }[]
  isLoadingPlaces: boolean
  parentOptions: { id: string; code: string; description: string }[]
  isLoadingParents: boolean
}

export function BillingCodeFormFields({
  isEditing,
  isSubmitting,
  onCancel,
  placesOfService = [],
  isLoadingPlaces,
  parentOptions = [],
  isLoadingParents,
}: BillingCodeFormFieldsProps) {
  const { control } = useFormContext()

  return (
    <>
      <div className="pb-24">
        <div className="max-w-5xl mx-auto">
          
          {/* BASIC INFORMATION */}
          <div className="mb-8 space-y-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="type"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingSelect
                      label="Type"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={[
                        { value: "CPT", label: "CPT" },
                        { value: "HCPCS", label: "HCPCS" },
                      ]}
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
                name="code"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Code"
                      value={field.value || ""}
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

              <div className="md:col-span-2">
                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label="Description"
                        value={field.value || ""}
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
              </div>
            </div>
          </div>

          {/* ORGANIZATION CONFIGURATION */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Organization Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="modifiers"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Modifiers (Optional)"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="HN, XP, TS"
                      hasError={!!fieldState.error}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="parent"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingSelect
                      label="Parent Code (Optional)"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={[
                        { value: "", label: "None" },
                        ...parentOptions.map(p => ({ 
                          value: p.id, 
                          label: p.description 
                            ? `${p.code} - ${p.description}` 
                            : p.code
                        }))
                      ]}
                      hasError={!!fieldState.error}
                      disabled={isLoadingParents}
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />

              <div className="md:col-span-2">
                <Controller
                  name="placeServiceId"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingSelect
                        label="Allowed Place of Service (Optional)"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        options={(placesOfService || []).map(p => ({ value: p.id, label: p.name }))}
                        hasError={!!fieldState.error}
                        disabled={isLoadingPlaces}
                      />
                      {fieldState.error && (
                        <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
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
        submitText={isEditing ? "Update Billing Code" : "Create Billing Code"}
      />
    </>
  )
}
