"use client"

import { useState } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { formatPhoneInput } from "@/lib/utils/phone-format"
import type { PayerBaseFormValues } from "@/lib/schemas/payer-form.schema"
import { PayerLogoUpload } from "./PayerLogoUpload"

interface CatalogItem {
  id: string
  name: string
}

interface PlanTypeItem {
  id: string
  name: string
  status?: string
}

interface PayerBaseFormProps {
  form: UseFormReturn<PayerBaseFormValues>
  countries: CatalogItem[]
  states: CatalogItem[]
  isLoadingCountries: boolean
  isLoadingStates: boolean
  planTypes?: PlanTypeItem[]
  isLoadingPlanTypes?: boolean
  existingLogoUrl?: string | null
}

export function PayerBaseForm({
  form,
  countries,
  states,
  isLoadingCountries,
  isLoadingStates,
  planTypes = [],
  isLoadingPlanTypes = false,
  existingLogoUrl,
}: PayerBaseFormProps) {
  const { control, watch } = form
  const selectedCountryId = watch("countryId")
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
          render={({ field, fieldState }) => {
            const [displayValue, setDisplayValue] = useState(
              formatPhoneInput(field.value || "")
            )
            return (
              <div>
                <FloatingInput
                  label="Phone"
                  value={displayValue}
                  onChange={(value) => {
                    const formatted = formatPhoneInput(value, displayValue)
                    setDisplayValue(formatted)
                    field.onChange(formatted)
                  }}
                  onBlur={field.onBlur}
                  type="tel"
                  placeholder="(305) 555-0000"
                  hasError={!!fieldState.error}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
              </div>
            )
          }}
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
                disabled={isLoadingCountries}
                searchable
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
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Plan Type */}
      <div className="md:col-span-2">
        <Controller
          name="planTypeId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Plan Type"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={planTypes.map((p) => ({
                  value: p.id,
                  label: p.status === "DEPRECATED" ? `${p.name} (Deprecated)` : p.name,
                }))}
                hasError={!!fieldState.error}
                disabled={isLoadingPlanTypes}
                searchable
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
