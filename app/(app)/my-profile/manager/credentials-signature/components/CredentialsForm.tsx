"use client"

import { useEffect } from "react"
import { useForm, Controller, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import {
  userCredentialFormSchema,
  getUserCredentialFormDefaults,
  type UserCredentialFormValues,
} from "@/lib/schemas/user-credentials.schema"
import type {
  UserCredential,
  UserCredentialTypeOption,
  CreateUserCredentialDto,
  UpdateUserCredentialDto,
} from "@/lib/types/user-credentials.types"

interface CredentialsFormProps {
  credentialTypes: UserCredentialTypeOption[]
  isLoadingTypes: boolean
  editingCredential: UserCredential | null
  onSave: (data: CreateUserCredentialDto) => Promise<void>
  onUpdate: (id: string, data: UpdateUserCredentialDto) => Promise<void>
  onCancelEdit: () => void
  isSaving: boolean
  getComputedStatus: (expirationDate: string) => "Active" | "Expired"
}

export function CredentialsForm({
  credentialTypes,
  isLoadingTypes,
  editingCredential,
  onSave,
  onUpdate,
  onCancelEdit,
  isSaving,
  getComputedStatus,
}: CredentialsFormProps) {
  const form = useForm<UserCredentialFormValues>({
    resolver: zodResolver(userCredentialFormSchema),
    defaultValues: getUserCredentialFormDefaults(),
    mode: "onChange",
  })

  const expirationDate = form.watch("expirationDate")
  const computedStatus = expirationDate ? getComputedStatus(expirationDate) : "Active"

  useEffect(() => {
    if (editingCredential) {
      form.reset({
        credentialTypeId: editingCredential.credentialTypeId,
        identificationNumber: editingCredential.identificationNumber,
        effectiveDate: editingCredential.effectiveDate,
        expirationDate: editingCredential.expirationDate,
      })
    }
  }, [editingCredential, form])

  const handleSubmit = async (data: UserCredentialFormValues) => {
    if (editingCredential) {
      await onUpdate(editingCredential.id, {
        credentialTypeId: data.credentialTypeId,
        identificationNumber: data.identificationNumber,
        effectiveDate: data.effectiveDate,
        expirationDate: data.expirationDate,
      })
    } else {
      await onSave({
        credentialTypeId: data.credentialTypeId,
        identificationNumber: data.identificationNumber,
        effectiveDate: data.effectiveDate,
        expirationDate: data.expirationDate,
      })
    }
    form.reset(getUserCredentialFormDefaults())
  }

  const handleCancel = () => {
    form.reset(getUserCredentialFormDefaults())
    onCancelEdit()
  }

  const credentialTypeOptions = credentialTypes.map((ct) => ({
    value: ct.id,
    label: ct.label,
  }))

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="credentialTypeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingSelect
                  label="Credential"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={credentialTypeOptions}
                  required
                  hasError={!!fieldState.error}
                  disabled={isLoadingTypes}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="identificationNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <FloatingInput
                  label="Identification Number"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder=" "
                  required
                  hasError={!!fieldState.error}
                />
                <p className="text-xs text-gray-500 mt-1.5">Numbers and hyphens only.</p>
                {fieldState.error && (
                  <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="effectiveDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <PremiumDatePicker
                label="Effective Date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />

          <Controller
            name="expirationDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <PremiumDatePicker
                label="Expiration Date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700 font-medium">Status (auto):</div>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
              computedStatus === "Active"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {computedStatus === "Active" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            {computedStatus}
          </span>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          {editingCredential && (
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>
              Cancel Edit
            </Button>
          )}
          <Button type="submit" disabled={isSaving} loading={isSaving}>
            {editingCredential ? "Update Credential" : "Save Credential"}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
