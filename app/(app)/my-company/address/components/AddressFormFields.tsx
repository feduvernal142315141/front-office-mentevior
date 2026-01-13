"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"

interface AddressFormFieldsProps {
  isEditing: boolean
  isSubmitting: boolean
  onCancel: () => void
  countries: { id: string; name: string }[]
  states: { id: string; name: string }[]
  placesOfService: { id: string; name: string }[]
  isLoadingCountries: boolean
  isLoadingStates: boolean
  isLoadingPlaces: boolean
}

export function AddressFormFields({
  isEditing,
  isSubmitting,
  onCancel,
  countries = [],
  states = [],
  placesOfService = [],
  isLoadingCountries,
  isLoadingStates,
  isLoadingPlaces,
}: AddressFormFieldsProps) {
  const { control, watch } = useFormContext()
  
  const selectedCountryId = watch("countryId")
  const isStateDisabled = !selectedCountryId || isLoadingStates

  return (
    <>
      <div className="pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Controller
              name="nickName"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Nickname"
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

            <Controller
              name="placeServiceId"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingSelect
                    label="Place of Service"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={(placesOfService || []).map(p => ({ value: p.id, label: p.name }))}
                    hasError={!!fieldState.error}
                    disabled={isLoadingPlaces}
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
              name="countryId"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingSelect
                    label="Country"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={(countries || []).map(c => ({ value: c.id, label: c.name }))}
                    hasError={!!fieldState.error}
                    disabled={isLoadingCountries}
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
              name="stateId"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingSelect
                    label="State"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={(states || []).map(s => ({ value: s.id, label: s.name }))}
                    hasError={!!fieldState.error}
                    disabled={isStateDisabled}
                    required
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600 mt-2">
                      {fieldState.error.message}
                    </p>
                  )}
                  {isStateDisabled && !selectedCountryId && (
                    <p className="text-sm text-slate-500 mt-2">
                      Select a country first
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="city"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="City"
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

            <Controller
              name="zipCode"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <FloatingInput
                    label="Zip Code"
                    value={field.value || ""}
                    onChange={(value) => {
                      const sanitized = value.replace(/\D/g, "").slice(0, 5)
                      field.onChange(sanitized)
                    }}
                    onBlur={field.onBlur}
                    placeholder=" "
                    hasError={!!fieldState.error}
                    inputMode="numeric"
                    maxLength={5}
                    pattern="[0-9]*"
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
                name="address"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Address"
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

            <Controller
              name="startDate"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <PremiumDatePicker
                    label="Start Date"
                    value={field.value || ""}
                    onChange={field.onChange}
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
              name="endDate"
              control={control}
              render={({ field, fieldState }) => (
                <div>
                  <PremiumDatePicker
                    label="End Date"
                    value={field.value || ""}
                    onChange={field.onChange}
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
                name="active"
                control={control}
                render={({ field }) => (
                  <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                    <PremiumSwitch
                      label="Active"
                      description="Mark address as active or inactive"
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </div>

          </div>
        </div>
      </div>

      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isEditing ? "Update Address" : "Create Address"}
      />
    </>
  )
}
