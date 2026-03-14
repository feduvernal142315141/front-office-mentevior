"use client"

import { Controller, useFormContext } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { ImageUpload } from "@/components/custom/ImageUpload"
import { Hash, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

function ChartIdConfiguration({ control }: { control: ReturnType<typeof useFormContext>["control"] }) {
  const { watch } = useFormContext()
  const prefix = watch("chartPrefix") || "BA"
  const startNumber = watch("chartStartNumber") || 1

  return (
    <div className="col-span-1 lg:col-span-2 mt-2">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-[#037ECC]/10 border border-[#037ECC]/20">
            <Hash className="w-5 h-5 text-[#037ECC]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Chart ID Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the prefix and starting number for auto-generated client Chart IDs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Controller
            name="chartPrefix"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Chart Prefix"
                  value={field.value}
                  onChange={(v) => field.onChange(v.toUpperCase())}
                  onBlur={field.onBlur}
                  placeholder=" "
                  hasError={!!fieldState.error}
                  maxLength={10}
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
            name="chartStartNumber"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Starting Number"
                  value={field.value?.toString() || ""}
                  onChange={(v) => {
                    const num = parseInt(v, 10)
                    field.onChange(isNaN(num) ? "" : num)
                  }}
                  onBlur={field.onBlur}
                  placeholder=" "
                  hasError={!!fieldState.error}
                  inputMode="numeric"
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

        <div className="mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#037ECC]/5 border border-[#037ECC]/10">
          <Eye className="w-4 h-4 text-[#037ECC] flex-shrink-0" />
          <span className="text-sm text-slate-600">Preview:</span>
          <span className={cn(
            "text-sm font-bold font-mono tracking-wider",
            prefix && startNumber ? "text-[#037ECC]" : "text-slate-400"
          )}>
            {prefix || "BA"}{String(startNumber || 1)}
          </span>
        </div>
      </div>
    </div>
  )
}

interface AccountProfileFormFieldsProps {
  isSubmitting: boolean
  onCancel: () => void
}

export function AccountProfileFormFields({
  isSubmitting,
  onCancel,
}: AccountProfileFormFieldsProps) {
  const { control } = useFormContext()

  return (
    <>
      <div className="pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="space-y-6">
              <Controller
                name="legalName"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Legal name"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      hasError={!!fieldState.error}
                      autoComplete="organization"
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
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Phone number"
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
                name="ein"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Employer Identification Number (EIN)"
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
                name="npi"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="National Provider ID (NPI)"
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
                name="mpi"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Medicaid/Medicare Provider ID (MPI)"
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
                name="taxonomyCode"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Taxonomy Code"
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

             
            </div>

            <div className="space-y-6">              

              <Controller
                name="agencyEmail"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Agency Email"
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
                name="fax"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Fax"
                      value={field.value || ""}
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
                name="webSite"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <FloatingInput
                      label="Website"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder=" "
                      type="url"
                      autoComplete="url"
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
                name="logo"
                control={control}
                render={({ field, fieldState }) => (
                  <ImageUpload
                    label="Company Logo"
                    value={field.value || ""}
                    onChange={field.onChange}
                    hasError={!!fieldState.error}
                    disabled={isSubmitting}
                    maxSizeMB={1}
                  />
                )}
              />
            </div>
          </div>

          <ChartIdConfiguration control={control} />
        </div>
      </div>

      <FormBottomBar
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        submitText="Save Changes"
      />
    </>
  )
}
