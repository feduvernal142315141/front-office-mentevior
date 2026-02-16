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
import { useMemo, useState } from "react"

interface PersonalInformationSectionProps {
  canEditRole: boolean
}

export function PersonalInformationSection({ canEditRole }: PersonalInformationSectionProps) {
  const { control } = useFormContext()
  const { roles, isLoading: isLoadingRoles } = useRoles()
  const { countries, isLoading: isLoadingCountries } = useCountries()
  
  const usaCountry = countries.find(c => c.name === "United States")
  const usaCountryId = usaCountry?.id || null
  
  const { states, isLoading: isLoadingStates } = useStates(usaCountryId)

  const roleName = useWatch({ control, name: "roleName" }) || ""
  const roleId = useWatch({ control, name: "roleId" }) || ""

  const roleOptions = useMemo(() => {
    const options = roles.map((role) => ({ value: role.id, label: role.name }))
    if (roleId && roleName && !options.some((opt) => opt.value === roleId)) {
      options.unshift({ value: roleId, label: roleName })
    }
    return options
  }, [roles, roleId, roleName])

  // SSN masking state
  const [isEditingSSN, setIsEditingSSN] = useState(false)

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
            <div data-field="firstName">
              <FloatingInput
                label="First Name"
                name="firstName"
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
            <div data-field="lastName">
              <FloatingInput
                label="Last Name"
                name="lastName"
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
            <div data-field="birthday">
              <PremiumDatePicker
                label="Birthday"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />

        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <div data-field="country">
              <FloatingInput
                label="Country"
                name="country"
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
            <div data-field="state">
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
            <div data-field="city">
              <FloatingInput
                label="City"
                name="city"
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
            <div data-field="zipCode">
              <FloatingInput
                label="Zip Code"
                name="zipCode"
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
            <div className="lg:col-span-2" data-field="homeAddressLine1">
              <FloatingInput
                label="Home Address - Line 1"
                name="homeAddressLine1"
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
            <div data-field="email">
              <FloatingInput
                label="Email"
                name="email"
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
            <div data-field="cellphone">
              <FloatingInput
                label="Cellphone Number"
                name="cellphone"
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
            <div data-field="roleId">
              <FloatingSelect
                label="Role"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={roleOptions}
                hasError={!!fieldState.error}
                required
                disabled={!canEditRole || isLoadingRoles}
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
            <div data-field="hiringDate">
              <PremiumDatePicker
                label="Hiring Date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />

        <Controller
          name="ssn"
          control={control}
          render={({ field, fieldState }) => {
            // Get clean SSN (only digits)
            const cleanSSN = field.value.replace(/\D/g, "")
            
            // Display value based on editing state and SSN length
            let displayValue = cleanSSN
            
            if (!isEditingSSN) {
              if (cleanSSN.length === 9) {
                // Full SSN: show xxx-xx-4444
                displayValue = `xxx-xx-${cleanSSN.slice(5)}`
              } else if (cleanSSN.length === 4) {
                // Partial SSN (last 4 from backend): show xxx-xx-4444
                displayValue = `xxx-xx-${cleanSSN}`
              } else {
                // Unknown length: show as is
                displayValue = field.value
              }
            }

            return (
              <div 
                data-field="ssn"
                onFocus={() => setIsEditingSSN(true)}
                onBlur={() => setIsEditingSSN(false)}
              >
                <FloatingInput
                  label="Social Security Number (SSN)"
                  name="ssn"
                  value={displayValue}
                  onChange={(value) => {
                    // When user starts typing, switch to edit mode and accept only digits
                    const digits = value.replace(/\D/g, "").slice(0, 9)
                    field.onChange(digits)
                  }}
                  onBlur={() => {
                    field.onBlur()
                  }}
                  placeholder="XXX-XX-XXXX"
                  hasError={!!fieldState.error}
                  type="text"
                  maxLength={isEditingSSN ? 9 : 11}
                  required
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )
          }}
        />
      </div>
    </CollapsableSection>
  )
}
