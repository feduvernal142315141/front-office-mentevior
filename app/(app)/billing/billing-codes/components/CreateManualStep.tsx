
"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { Button } from "@/components/custom/Button"
import { Loader2 } from "lucide-react"
import { billingCodeFormSchema, getBillingCodeFormDefaults, type BillingCodeFormValues } from "@/lib/schemas/billing-code-form.schema"
import { useCreateBillingCode } from "@/lib/modules/billing-codes/hooks/use-create-billing-code"

interface CreateManualStepProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateManualStep({ onSuccess, onCancel }: CreateManualStepProps) {
  const { create, isLoading } = useCreateBillingCode()

  const form = useForm<BillingCodeFormValues>({
    resolver: zodResolver(billingCodeFormSchema),
    defaultValues: getBillingCodeFormDefaults(),
  })

  const onSubmit = async (data: BillingCodeFormValues) => {
    // const result = await create({
    //   type: data.type,
    //   code: data.code,
    //   description: data.description,
    //   modifiers: data.modifiers,
    //   parent: data.parent,
    //   allowedPlacesOfService: data.allowedPlacesOfService,
    //   active: data.active ?? true,
    // })

    // if (result) {
    //   onSuccess()
    // }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">Create Custom Code</h2>
        <p className="text-gray-600 mt-1">Enter all details for your custom billing code</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        <Controller
          name="type"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Type"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={[
                  { value: "CPT", label: "CPT" },
                  { value: "HCPCS", label: "HCPCS" },
                ]}
                hasError={!!fieldState.error}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="code"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Code"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder=" "
                hasError={!!fieldState.error}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                rows={4}
                placeholder="Enter detailed description of the billing code..."
                className={`
                  w-full px-4 py-3 rounded-xl
                  border-2 transition-all outline-none
                  ${fieldState.error 
                    ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  }
                `}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="modifiers"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modifiers (Optional)
              </label>
        
              <input
                type="text"
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="HN, XP, TS"
                className="
                  w-full h-12 px-4 rounded-xl
                  border-2 border-gray-200
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                  outline-none transition-all
                "
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="parent"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Parent Code (Optional)"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="enter_parent"
                hasError={!!fieldState.error}
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="placeServiceId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Place of Service (Optional)
              </label>
              <input
                type="text"
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Office, Telehealth, Home"
                className="
                  w-full h-12 px-4 rounded-xl
                  border-2 border-gray-200
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                  outline-none transition-all
                "
              />
              {fieldState.error && (
                <p className="text-sm text-red-600 mt-2">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Billing Code"
          )}
        </Button>
      </div>
    </form>
  )
}
