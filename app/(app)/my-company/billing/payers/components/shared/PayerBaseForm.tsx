"use client"

import { useWatch, Controller, type UseFormReturn } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import type { PayerFullFormValues } from "@/lib/schemas/payer-form.schema"
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
  form: UseFormReturn<PayerFullFormValues>
  countries: CatalogItem[]
  states: CatalogItem[]
  isLoadingCountries: boolean
  isLoadingStates: boolean
  clearingHouses?: ClearingHouseItem[]
  isLoadingClearingHouses?: boolean
  existingLogoUrl?: string | null
  existingLogoTitle?: string
  existingLogoHint?: string
  onLogoClear?: () => void
  isCountryDisabled?: boolean
  readOnly?: boolean
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
  existingLogoTitle,
  existingLogoHint,
  onLogoClear,
  isCountryDisabled = false,
  readOnly = false,
}: PayerBaseFormProps) {
  const { control } = form
  const selectedCountryId = useWatch({ control, name: "countryId" })
  const isStateDisabled = readOnly || !selectedCountryId || isLoadingStates

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Logo */}
      <div className="md:col-span-2" data-form-field="logo">
        <Controller
          name="logo"
          control={control}
          render={({ field, fieldState }) => (
            <PayerLogoUpload
              value={field.value ?? ""}
              onChange={field.onChange}
              existingLogoUrl={existingLogoUrl}
              existingTitle={existingLogoTitle}
              existingHint={existingLogoHint}
              onClear={onLogoClear}
              error={fieldState.error?.message}
              readOnly={readOnly}
            />
          )}
        />
      </div>

      {/* Name */}
      <div className="md:col-span-2" data-form-field="name">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Phone */}
      <div data-form-field="phone">
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
              disabled={readOnly}
              required
            />
          )}
        />
      </div>

      {/* Email */}
      <div data-form-field="email">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* External ID */}
      <div data-form-field="externalId">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Group Number */}
      <div data-form-field="groupNumber">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Address Line 1 */}
      <div className="md:col-span-2" data-form-field="addressLine1">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Address Line 2 */}
      <div className="md:col-span-2" data-form-field="addressLine2">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Country */}
      <div data-form-field="countryId">
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
                disabled={readOnly || isLoadingCountries || isCountryDisabled}
                searchable={!readOnly && !isCountryDisabled}
                required
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* State */}
      <div data-form-field="stateId">
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
                searchable={!readOnly}
                required
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
              {!readOnly && isStateDisabled && !selectedCountryId && (
                <p className="text-sm text-slate-500 mt-2">Select a country first</p>
              )}
            </div>
          )}
        />
      </div>

      {/* City */}
      <div data-form-field="city">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Zip Code */}
      <div data-form-field="zipCode">
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
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Allow Clearing Houses */}
      <div className="md:col-span-2" data-form-field="planTypeId">
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
                disabled={readOnly || isLoadingClearingHouses}
                searchable={!readOnly}
                required
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Description */}
      <div className="md:col-span-2" data-form-field="description">
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingTextarea
                label="Description"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                rows={3}
                placeholder="Coverage notes and billing caveats"
                disabled={readOnly}
              />
              {!readOnly && fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  )
}
