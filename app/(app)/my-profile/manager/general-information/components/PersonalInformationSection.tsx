"use client"

import { Controller, useFormContext, useWatch } from "react-hook-form"
import { CollapsableSection } from "@/components/custom/CollapsableSection"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { User } from "lucide-react"
import { useRoles } from "@/lib/modules/roles/hooks/use-roles"
import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"

export function PersonalInformationSection() {
  const { control } = useFormContext()
  const { roles, isLoading: isLoadingRoles } = useRoles()
  const { countries, isLoading: isLoadingCountries } = useCountries()
  
  const usaCountry = countries.find(c => c.name === "United States")
  const usaCountryId = usaCountry?.id || null
  
  const { states, isLoading: isLoadingStates } = useStates(usaCountryId)

  return (
    <CollapsableSection
      title="Personal Information"
      subtitle="Basic details and contact information"
      icon={<User className="w-4 h-4" />}
      defaultOpen={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="First Name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                autoComplete="given-name"
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
          name="lastName"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Last Name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                autoComplete="family-name"
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
          name="birthday"
          control={control}
          render={({ field, fieldState }) => (
            <PremiumDatePicker
              label="Birthday"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Country"
                value="United States"
                onChange={() => {}}
                onBlur={field.onBlur}
                placeholder=" "
                disabled={true}
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
          name="state"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="State"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={states.map((s) => ({ value: s.id, label: s.name }))}
                hasError={!!fieldState.error}
                required
                disabled={isLoadingStates || !usaCountryId}
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
          name="city"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="City"
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
          name="zipCode"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Zip Code"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                type="text"
                maxLength={9}
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
          name="homeAddressLine1"
          control={control}
          render={({ field, fieldState }) => (
            <div className="lg:col-span-2">
              <FloatingInput
                label="Home Address - Line 1"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
                autoComplete="street-address"
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
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Email"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                type="email"
                hasError={!!fieldState.error}
                autoComplete="email"
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
          name="cellphone"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Cellphone Number"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                type="tel"
                hasError={!!fieldState.error}
                autoComplete="tel"
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
          name="roleId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Role"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                hasError={!!fieldState.error}
                required
                disabled={isLoadingRoles}
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
          name="hiringDate"
          control={control}
          render={({ field, fieldState }) => (
            <PremiumDatePicker
              label="Hiring Date"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="ssn"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Social Security Number (SSN)"
                value={field.value}
                onChange={(value) => {
                  let cleanValue = value.replace(/\D/g, "")
                  if (cleanValue.length >= 3) {
                    cleanValue = cleanValue.slice(0, 3) + "-" + cleanValue.slice(3)
                  }
                  if (cleanValue.length >= 6) {
                    cleanValue = cleanValue.slice(0, 6) + "-" + cleanValue.slice(6, 10)
                  }
                  field.onChange(cleanValue)
                }}
                onBlur={field.onBlur}
                placeholder="XXX-XX-XXXX"
                hasError={!!fieldState.error}
                type="text"
                maxLength={11}
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
