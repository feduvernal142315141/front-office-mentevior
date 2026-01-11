"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Badge } from "@/components/ui/badge"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { Button } from "@/components/custom/Button"
import { Lock, Loader2 } from "lucide-react"
import { billingCodeFormSchema, getBillingCodeFormFromCatalog, type BillingCodeFormValues } from "@/lib/schemas/billing-code-form.schema"
import type { BillingCodeCatalogItem } from "@/lib/types/billing-code.types"
import { useCreateBillingCode } from "@/lib/modules/billing-codes/hooks/use-create-billing-code"

interface ReviewCustomizeStepProps {
  catalogCode: BillingCodeCatalogItem
  onSuccess: () => void
  onCancel: () => void
}

export function ReviewCustomizeStep({ catalogCode, onSuccess, onCancel }: ReviewCustomizeStepProps) {
  const { create, isLoading } = useCreateBillingCode()

  const form = useForm<BillingCodeFormValues>({
    resolver: zodResolver(billingCodeFormSchema),
    defaultValues: getBillingCodeFormFromCatalog(catalogCode),
  })

  const onSubmit = async (data: BillingCodeFormValues) => {
    const result = await create({
      type: data.type,
      code: data.code,
      description: data.description,
      modifiers: data.modifiers,
      parent: data.parent,
      allowedPlacesOfService: data.allowedPlacesOfService,
      active: data.active ?? true,
      catalogId: data.catalogId,
    })

    if (result) {
      onSuccess()
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-600 mt-1">Customize this code for your organization</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Imported from Official Catalog
            </h3>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <Badge 
                variant="outline"
                className={
                  catalogCode.type === "CPT" 
                    ? "border-green-200 bg-green-50 text-green-700 text-base px-3 py-1"
                    : "border-purple-200 bg-purple-50 text-purple-700 text-base px-3 py-1"
                }
              >
                {catalogCode.type}
              </Badge>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
              <div className="text-2xl font-bold text-gray-900">{catalogCode.code}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-900">{catalogCode.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Organization Configuration
          </h3>
          
          <div className="space-y-6">
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
                    value={(field.value || []).join(", ")}
                    onChange={(e) => {
                      const value = e.target.value
                      const mods = value.split(",").map(m => m.trim()).filter(Boolean)
                      field.onChange(mods)
                    }}
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
              name="allowedPlacesOfService"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Places of Service (Optional)
                  </label>
                  <input
                    type="text"
                    value={(field.value || []).join(", ")}
                    onChange={(e) => {
                      const value = e.target.value
                      const places = value.split(",").map(p => p.trim()).filter(Boolean)
                      field.onChange(places)
                    }}
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
        </div>
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
              Adding...
            </>
          ) : (
            "Add to Organization"
          )}
        </Button>
      </div>
    </form>
  )
}
