"use client"

import { useWatch, Controller, type UseFormReturn } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import type { PayerBaseFormValues } from "@/lib/schemas/payer-form.schema"
import { PayerLogoUpload } from "./PayerLogoUpload"
import { PhoneInputField } from "./PhoneInputField"

interface CatalogItem {
  id: string
  name: string
}

interface ClearingHouseItem {
  id: string
  name: string
}

interface PayerBaseFormProps {
  form: UseFormReturn<PayerBaseFormValues>
  countries: CatalogItem[]
  states: CatalogItem[]
  isLoadingCountries: boolean
  isLoadingStates: boolean
  clearingHouses?: ClearingHouseItem[]
  isLoadingClearingHouses?: boolean
  existingLogoUrl?: string | null
  isCountryDisabled?: boolean
}

export function PayerBaseForm({
  form,
  countries,
  states,
  isLoadingCountries,
  isLoadingStates,
  clearingHouses = [],
  isLoadingClearingHouses = false,
  existingLogoUrl,
  isCountryDisabled = false,
}: PayerBaseFormProps) {
  const { control } = form
  const selectedCountryId = useWatch({ control, name: "countryId" })
  const isStateDisabled = !selectedCountryId || isLoadingStates

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Logo */}
      <div className="md:col-span-2">
        <Controller
          name="logo"
          control={control}
          render={({ field, fieldState }) => (
            <PayerLogoUpload
              value={field.value ?? ""}
              onChange={field.onChange}
              existingLogoUrl={existingLogoUrl}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      {/* Name */}
      <div className="md:col-span-2">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Insurance name"
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Phone */}
      <div>
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <PhoneInputField
              value={field.value || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </div>

      {/* Email */}
      <div>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Email"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                type="email"
                placeholder="payer@insurance.com"
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* External ID */}
      <div>
        <Controller
          name="externalId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="External ID"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Member ID / External reference"
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Group Number */}
      <div>
        <Controller
          name="groupNumber"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Group Number"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Address Line 1 */}
      <div className="md:col-span-2">
        <Controller
          name="addressLine1"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Address Line 1"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Street and number"
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Address Line 2 */}
      <div className="md:col-span-2">
        <Controller
          name="addressLine2"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Address Line 2"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Suite, floor, etc. (optional)"
                hasError={!!fieldState.error}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Country */}
      <div>
        <Controller
          name="countryId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Country"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={countries.map((c) => ({ value: c.id, label: c.name }))}
                hasError={!!fieldState.error}
                disabled={isLoadingCountries || isCountryDisabled}
                searchable={!isCountryDisabled}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* State */}
      <div>
        <Controller
          name="stateId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="State"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={states.map((s) => ({ value: s.id, label: s.name }))}
                hasError={!!fieldState.error}
                disabled={isStateDisabled}
                searchable
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
              {isStateDisabled && !selectedCountryId && (
                <p className="text-sm text-slate-500 mt-2">Select a country first</p>
              )}
            </div>
          )}
        />
      </div>

      {/* City */}
      <div>
        <Controller
          name="city"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="City"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Zip Code */}
      <div>
        <Controller
          name="zipCode"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Zip Code"
                value={field.value}
                onChange={(value) => field.onChange(value.replace(/\D/g, "").slice(0, 5))}
                onBlur={field.onBlur}
                inputMode="numeric"
                maxLength={5}
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Allow Clearing Houses */}
      <div className="md:col-span-2">
        <Controller
          name="planTypeId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Allow Clearing Houses"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={clearingHouses.map((item) => ({ value: item.id, label: item.name }))}
                hasError={!!fieldState.error}
                disabled={isLoadingClearingHouses}
                required
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Plan Notes */}
      <div className="md:col-span-2">
        <Controller
          name="planNotes"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingTextarea
                label="Internal Notes"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                rows={3}
                placeholder="Coverage notes and billing caveats"
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  )
}
