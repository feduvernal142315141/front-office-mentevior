"use client"

import { Controller, useFormContext } from "react-hook-form"
import Link from "next/link"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { PremiumSwitch } from "@/components/custom/PremiumSwitch"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { User, Shield, Info, UserCheck, Sliders, ArrowRight } from "lucide-react"

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
  currentUser: any
  editingUser: any
}

export function UserFormFields({
  isEditing,
  roles,
  isLoadingRoles,
  isSubmitting,
  onCancel,
  currentUser,
  editingUser,
}: UserFormFieldsProps) {
  const { control, setValue } = useFormContext()

  const roleOptions = [
    { value: "", label: "Select a role" },
    ...roles.map((role) => ({ value: role.id, label: role.name })),
  ]

  if (editingUser?.role && !roleOptions.some((opt) => opt.value === editingUser.role.id)) {
    roleOptions.splice(1, 0, { value: editingUser.role.id, label: editingUser.role.name })
  }

  const isEditingSelf = isEditing && 
    currentUser && 
    editingUser && 
    currentUser.email?.toLowerCase() === editingUser.email?.toLowerCase() &&
    editingUser.role?.name?.toLowerCase() === "superadmin"

  const currentRoleName = currentUser?.role?.name || currentUser?.role || currentUser?.roleName || ""
  const normalizedRole = String(currentRoleName).replace(/[\s_-]/g, "").toLowerCase()
  const isSuperAdmin = normalizedRole.includes("superadmin")
  const canEditRole = isSuperAdmin && !isEditingSelf

  return (
    <>

      <div className="pb-24">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-7">

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-600">
                    Basic details for this user
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div>
                      <FloatingInput
                        label={"First Name"}
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
                      {!fieldState.error && (
                        <p className="text-xs text-gray-500 mt-1.5">Used as username</p>
                      )}
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
                      description={isEditing ? undefined : "Pre-filled with today's date"}
                    />
                  )}
                />
              </div>
            </div>

    
            <div className="border-t border-gray-200" />

      
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Role and Permissions
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div>
                  <Controller
                    name="roleId"
                    control={control}
                    render={({ field, fieldState }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role <span className="text-[#2563EB]">*</span>
                        </label>
                        <FilterSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={roleOptions}
                          placeholder="Select a role"
                          className="w-full"
                          fullWidth
                          disabled={!canEditRole}
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

                {isEditing && editingUser?.id && (
                  <Link href={`/users/${editingUser.id}/manager`} className="block w-full">
                    <div className="group relative overflow-hidden cursor-pointer rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm hover:border-[#037ECC]/40 hover:shadow-lg hover:shadow-[#037ECC]/10 transition-all duration-300 h-full min-h-[112px] flex items-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#037ECC]/0 via-[#079CFB]/0 to-[#037ECC]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative px-5 py-4 w-full">
                        <div className="flex items-start gap-3.5">
                          <div className="flex-shrink-0 p-2.5 rounded-xl bg-[#037ECC]/10 text-[#037ECC] ring-1 ring-inset ring-[#037ECC]/20 group-hover:bg-[#037ECC]/15 transition-colors">
                            <Sliders className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#037ECC] transition-colors leading-tight">
                                User Management
                              </h4>
                              <ArrowRight className="w-4 h-4 text-[#037ECC] group-hover:text-[#079CFB] group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0 mt-0.5" />
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">
                              Advanced configuration for this user
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
                    </div>
                  </Link>
                )}
              </div>
            </div>

  
            {isEditing && (
              <>
                <div className="border-t border-gray-200" />
                
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <UserCheck className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        User Status
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                          <PremiumSwitch
                            checked={field.value ?? true}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
          
                              if (checked) {
                                setValue("terminated", false)
                              }
                            }}
                            label="Active User"
                            description={isEditingSelf ? "Cannot modify your own status" : "Enable or disable user access to the system"}
                            variant="success"
                            disabled={isEditingSelf}
                          />
                        </div>
                      )}
                    />

                    <Controller
                      name="terminated"
                      control={control}
                      render={({ field }) => (
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                          <PremiumSwitch
                            checked={field.value ?? false}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              if (checked) {
                                setValue("active", false)
                              }
                            }}
                            label="Terminated"
                            description={isEditingSelf ? "Cannot modify your own status" : "Mark user as terminated or unemployed"}
                            variant="danger"
                            disabled={isEditingSelf}
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            {!isEditing && (
              <>
                <div className="border-t border-gray-200" />
                
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-blue-900 font-semibold text-sm mb-1">
                        Password Generation
                      </h5>
                      <p className="text-blue-800 text-sm">
                        A secure temporary password will be automatically generated and sent
                        to the user's email. The user can change it after their first login.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText={isEditing ? "Update User" : "Create User"}
        disabled={isLoadingRoles}
      />
    </>
  )
}
