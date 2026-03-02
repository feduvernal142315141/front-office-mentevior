"use client"

import { Controller } from "react-hook-form"
import { useState, useEffect } from "react"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import type { Client } from "@/lib/types/client.types"
import { useLanguagesCatalog } from "@/lib/modules/languages/hooks/use-languages-catalog"
import { useGenderCatalog } from "@/lib/modules/gender/hooks/use-gender-catalog"
import { formatPhoneInput } from "@/lib/utils/phone-format"
import { UserCheck } from "lucide-react"
import { useStep1Form } from "./useStep1Form"

interface Step1PersonalInfoProps {
  client: Client | null
  clientId: string
  isCreateMode?: boolean
  onSaveSuccess: (data: unknown) => void
  onValidationError: (errors: Record<string, string>) => void
  registerSubmit: (submitFn: () => Promise<void>) => void
  registerValidation: (isValid: boolean) => void
}

export function Step1PersonalInfo({ client, isCreateMode = false, onSaveSuccess, onValidationError, registerSubmit, registerValidation }: Step1PersonalInfoProps) {
  const [isEditingSSN, setIsEditingSSN] = useState(false)
  const { languages, isLoading: isLoadingLanguages } = useLanguagesCatalog()
  const { genders, isLoading: isLoadingGenders } = useGenderCatalog()

  const { form, handleSubmit, isValid } = useStep1Form({ client, isCreateMode, onSaveSuccess, onValidationError })

  const languageOptions = languages.map((lang) => ({ 
    value: lang.id, 
    label: lang.name 
  }))

  const genderOptions = genders.map((gender) => ({ 
    value: gender.id, 
    label: gender.name 
  }))

  useEffect(() => {
    registerSubmit(handleSubmit)
  }, [handleSubmit, registerSubmit])

  useEffect(() => {
    registerValidation(isValid)
  }, [isValid, registerValidation])

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="firstName"
          control={form.control}
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
          control={form.control}
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
          name="phoneNumber"
          control={form.control}
          render={({ field, fieldState }) => {
            const [displayValue, setDisplayValue] = useState(formatPhoneInput(field.value))
            
            return (
              <div>
                <FloatingInput
                  label="Phone Number"
                  value={displayValue}
                  onChange={(value) => {
                    const formatted = formatPhoneInput(value, displayValue)
                    setDisplayValue(formatted)
                    field.onChange(formatted)
                  }}
                  onBlur={field.onBlur}
                  placeholder="(305) 555-1234"
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
            )
          }}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Email"
                value={field.value || ""}
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
          name="genderId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Gender"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={genderOptions}
                hasError={!!fieldState.error}
                disabled={isLoadingGenders}
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
          name="ssn"
          control={form.control}
          render={({ field, fieldState }) => {
            const cleanSSN = (field.value || "").replace(/\D/g, "")
            
            let displayValue = cleanSSN
            
            if (!isEditingSSN) {
              if (cleanSSN.length === 9) {
                displayValue = `xxx-xx-${cleanSSN.slice(5)}`
              } else if (cleanSSN.length === 4) {
                displayValue = `xxx-xx-${cleanSSN}`
              } else {
                displayValue = field.value || ""
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

        <Controller
          name="brithDate"
          control={form.control}
          render={({ field, fieldState }) => (
            <PremiumDatePicker
              label="Date of Birth"
              value={field.value || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              required
            />
          )}
        />

        <Controller
          name="chartId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Chart ID"
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
          name="languages"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Languages"
                value={field.value?.[0] || ""}
                onChange={(value) => field.onChange(value ? [value] : [])}
                onBlur={field.onBlur}
                options={languageOptions}
                hasError={!!fieldState.error}
                disabled={isLoadingLanguages}
                searchable
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

      <div className="border-t border-gray-200 mt-8 pt-8" />

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-50 rounded-lg">
          <UserCheck className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Client Status
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Controller
          name="active"
          control={form.control}
          render={({ field }) => (
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <PremiumSwitch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                label="Active Client"
                description="Enable or disable client access and visibility"
                variant="success"
              />
            </div>
          )}
        />
      </div>
    </div>
  )
}
