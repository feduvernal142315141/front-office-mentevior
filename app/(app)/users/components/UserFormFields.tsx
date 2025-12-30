"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Card } from "@/components/custom/Card"
import { Button } from "@/components/custom/Button"
import { User, Shield, Loader2, Save, Info } from "lucide-react"
interface RoleOption {
  id: string
  name: string
}

interface UserFormFieldsProps {
  isEditing: boolean
  roles: RoleOption[]
  isLoadingRoles: boolean
  isSubmitting: boolean
  onCancel: () => void
}

export function UserFormFields({
  isEditing,
  roles,
  isLoadingRoles,
  isSubmitting,
  onCancel,
}: UserFormFieldsProps) {
  const { control } = useFormContext()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Personal Information Card */}
      <Card
        variant="elevated"
        padding="lg"
        header={
          <Card.Header
            title="Personal Information"
            subtitle="Basic details for this user"
            icon={
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-700" />
              </div>
            }
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
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
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Last Name */}
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
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Email */}
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
                />
                {!fieldState.error && (
                  <p className="text-sm text-gray-600 mt-2">
                    This email will be used as username to access the Front Office
                  </p>
                )}
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Cellphone */}
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
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Hiring Date */}
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
                description={
                  isEditing
                    ? "Date when the user was hired"
                    : "Pre-filled with today's date (editable)"
                }
              />
            )}
          />
        </div>
      </Card>

      {/* Role and Permissions Card */}
      <Card
        variant="elevated"
        padding="lg"
        header={
          <Card.Header
            title="Role and Permissions"
            subtitle="Define user capabilities"
            icon={
              <div className="p-2 bg-purple-50 rounded-lg">
                <Shield className="w-5 h-5 text-purple-700" />
              </div>
            }
          />
        }
      >
        <Controller
          name="roleId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <FilterSelect
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "", label: "Select a role" },
                  ...roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                  })),
                ]}
                placeholder="Select a role"
              />
              {!fieldState.error && (
                <p className="text-sm text-gray-600 mt-2">
                  The role determines which permissions the user will have
                </p>
              )}
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </Card>

      {/* Password Generation Alert (only for create mode) */}
      {!isEditing && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h5 className="text-blue-900 font-semibold text-sm mb-1">
                Password Generation
              </h5>
              <p className="text-blue-800 text-sm">
                A secure temporary password will be automatically generated and sent to the
                user's email. The user can change it after their first login.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isLoadingRoles}
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? "Update User" : "Create User"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
