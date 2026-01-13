"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PHYSICIAN_SPECIALTIES, PHYSICIAN_TYPES } from "@/lib/types/physician.types"
import type { PhysicianType } from "@/lib/types/physician.types"

interface PhysicianFormFieldsProps {
  isEditing: boolean
  countries: { id: string; name: string }[]
  states: { id: string; name: string }[]
  physicianTypes: PhysicianType[]
  isLoadingCountries: boolean
  isLoadingStates: boolean
  isLoadingPhysicianTypes: boolean
}

// Phone/Fax formatter
const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
}

export function PhysicianFormFields({
  isEditing,
  countries = [],
  states = [],
  physicianTypes = [],
  isLoadingCountries,
  isLoadingStates,
  isLoadingPhysicianTypes,
}: PhysicianFormFieldsProps) {
  const { control } = useFormContext()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* First Name */}
          <Controller
            name="firstName"
            control={control}
            render={({ field, fieldState }) => {
              const handleChange = (e: any) => {
                if (typeof e === 'string') {
                  field.onChange(e.replace(/[^a-zA-Z\s]/g, ""))
                } else if (e?.target?.value !== undefined) {
                  field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
                }
              }
              
              return (
                <div>
                  <FloatingInput
                    label="First name"
                    value={field.value}
                    onChange={handleChange}
                    onBlur={field.onBlur}
                    placeholder=" "
                    hasError={!!fieldState.error}
                    required={true}
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

          {/* Last Name */}
          <Controller
            name="lastName"
            control={control}
            render={({ field, fieldState }) => {
              const handleChange = (e: any) => {
                if (typeof e === 'string') {
                  field.onChange(e.replace(/[^a-zA-Z\s]/g, ""))
                } else if (e?.target?.value !== undefined) {
                  field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
                }
              }
              
              return (
                <div>
                  <FloatingInput
                    label="Last name"
                    value={field.value}
                    onChange={handleChange}
                    onBlur={field.onBlur}
                    placeholder=" "
                    hasError={!!fieldState.error}
                    required={true}
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

          {/* Specialty */}
          <Controller
            name="specialty"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Specialty"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={PHYSICIAN_SPECIALTIES}
                  hasError={!!fieldState.error}
                  required={true}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Type */}
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => {
              // Use dynamic data if available, otherwise fallback to hardcoded
              const typeOptions = physicianTypes.length > 0 
                ? physicianTypes.map(t => ({ value: t.code, label: t.name }))
                : PHYSICIAN_TYPES
              
              return (
                <div>
                  <FloatingSelect
                    label="Type"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={typeOptions}
                    hasError={!!fieldState.error}
                    disabled={isLoadingPhysicianTypes}
                    required={true}
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

          {/* NPI */}
          <Controller
            name="npi"
            control={control}
            render={({ field, fieldState }) => {
              const handleChange = (e: any) => {
                if (typeof e === 'string') {
                  const value = e.replace(/\D/g, "").slice(0, 10)
                  field.onChange(value)
                } else if (e?.target?.value !== undefined) {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                  field.onChange(value)
                }
              }
              
              return (
                <div>
                  <FloatingInput
                    label="NPI"
                    value={field.value}
                    onChange={handleChange}
                    onBlur={field.onBlur}
                    placeholder=" "
                    hasError={!!fieldState.error}
                    required={true}
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

          {/* MPI */}
          <Controller
            name="mpi"
            control={control}
            render={({ field, fieldState }) => {
              const handleChange = (e: any) => {
                if (typeof e === 'string') {
                  field.onChange(e.replace(/\D/g, "").slice(0, 10))
                } else if (e?.target?.value !== undefined) {
                  field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              }
              
              return (
                <div>
                  <FloatingInput
                    label="MPI"
                    value={field.value}
                    onChange={handleChange}
                    onBlur={field.onBlur}
                    placeholder=" "
                    hasError={!!fieldState.error}
                    required={true}
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

          {/* Phone */}
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => {
              const handleChange = (e: any) => {
                if (typeof e === 'string') {
                  field.onChange(formatPhoneNumber(e))
                } else if (e?.target?.value !== undefined) {
                  const formatted = formatPhoneNumber(e.target.value)
                  field.onChange(formatted)
                }
              }
              
              return (
                <div>
                  <FloatingInput
                    label="Phone"
                    value={field.value}
                    onChange={handleChange}
                    onBlur={field.onBlur}
                    placeholder=" "
                    hasError={!!fieldState.error}
                    required={true}
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

          {/* Fax */}
          <Controller
            name="fax"
            control={control}
            render={({ field, fieldState }) => {
              const handleChange = (e: any) => {
                if (typeof e === 'string') {
                  field.onChange(formatPhoneNumber(e))
                } else if (e?.target?.value !== undefined) {
                  const formatted = formatPhoneNumber(e.target.value)
                  field.onChange(formatted)
                }
              }
              
              return (
                <div>
                  <FloatingInput
                    label="Fax"
                    value={field.value || ""}
                    onChange={handleChange}
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
              )
            }}
          />

          {/* Email */}
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Email"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder=" "
                  hasError={!!fieldState.error}
                  required={true}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Active Toggle */}
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Label htmlFor="active" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Active
                </Label>
                <Switch
                  id="active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />

        </div>

        {/* Address Section */}
        <div className="border-t pt-6 mt-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Company Name */}
          <Controller
            name="companyName"
            control={control}
            render={({ field, fieldState }) => (
              <div className="md:col-span-2">
                <FloatingInput
                  label="Company Name"
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

          {/* Address */}
          <Controller
            name="address"
            control={control}
            render={({ field, fieldState }) => (
              <div className="md:col-span-2">
                <FloatingInput
                  label="Address"
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

          {/* Country - Fixed to USA */}
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
                  disabled={true}
                  placeholder="United States"
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

          {/* State - USA States */}
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
                  options={states.length > 0 ? states.map(s => ({ value: s.id, label: s.name })) : []}
                  hasError={!!fieldState.error}
                  disabled={isLoadingStates || states.length === 0}
                  searchable={true}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* City */}
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => {
              const handleChange = (e: any) => {
                if (typeof e === 'string') {
                  field.onChange(e.replace(/[^a-zA-Z\s]/g, ""))
                } else if (e?.target?.value !== undefined) {
                  field.onChange(e.target.value.replace(/[^a-zA-Z\s]/g, ""))
                }
              }
              
              return (
                <div>
                  <FloatingInput
                    label="City"
                    value={field.value || ""}
                    onChange={handleChange}
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
              )
            }}
          />

          {/* ZIP Code */}
          <Controller
            name="zipCode"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="ZIP Code"
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
  )
}
