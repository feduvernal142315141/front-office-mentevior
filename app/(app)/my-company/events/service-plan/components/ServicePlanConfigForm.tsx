"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { CalendarClock, ChevronDown, FileText, Settings } from "lucide-react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Card } from "@/components/custom/Card"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingColorPicker } from "@/components/custom/FloatingColorPicker"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { useUpsertServicePlanConfig } from "@/lib/modules/service-plan-config/hooks/use-upsert-service-plan-config"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useCredentialsCatalog } from "@/lib/modules/credentials/hooks/use-credentials-catalog"
import {
  servicePlanConfigSchema,
  getServicePlanConfigDefaults,
  type ServicePlanConfigFormValues,
} from "@/lib/schemas/service-plan-config-form.schema"
import type { ServicePlanConfig } from "@/lib/types/service-plan-config.types"
import { cn } from "@/lib/utils"

const EVENTS_PATH = "/my-company/events"

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

const SWITCH_ITEMS: {
  label: string
  description?: string
  field: "requireBillingCode" | "billable" | "requirePriorAuthorization"
}[] = [
  { label: "Require billing code", field: "requireBillingCode" },
  { label: "Billable", field: "billable" },
  { label: "Require prior authorization", field: "requirePriorAuthorization" },
]

interface ServicePlanConfigFormProps {
  config: ServicePlanConfig | null
}

export function ServicePlanConfigForm({ config }: ServicePlanConfigFormProps) {
  const router = useRouter()
  const { upsert, isLoading: isSaving } = useUpsertServicePlanConfig()
  const { billingCodes, isLoading: isLoadingBillingCodes } = useBillingCodes({ page: 0, pageSize: 100 })
  const { catalogCredentials, isLoading: isLoadingCredentials } = useCredentialsCatalog()
  const [generalExpanded, setGeneralExpanded] = useState(true)
  const [configExpanded, setConfigExpanded] = useState(true)

  const billingCodeOptions = billingCodes.map((bc) => ({
    value: bc.id,
    label: bc.code,
  }))

  const credentialOptions = catalogCredentials.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const form = useForm<ServicePlanConfigFormValues>({
    resolver: zodResolver(servicePlanConfigSchema),
    defaultValues: getServicePlanConfigDefaults(),
    mode: "onBlur",
  })

  const { handleSubmit, watch, setValue, formState: { errors } } = form

  useEffect(() => {
    if (!config) return
    form.reset({
      name:                     config.name ?? "",
      description:              config.description ?? "",
      billingCodeIds:           config.billingCodeIds,
      requireBillingCode:       config.requireBillingCode ? "yes" : "no",
      credentialIds:            config.credentialIds,
      billable:                 config.billable ? "yes" : "no",
      requirePriorAuthorization: config.requirePriorAuthorization ? "yes" : "no",
      maxBillingCodes:          String(config.maxBillingCodes),
      color:                    config.color ?? "",
    })
  }, [config, form])

  const w = watch()

  const onSubmit = handleSubmit(async (data) => {
    const result = await upsert({
      ...(config?.id ? { id: config.id } : {}),
      name:                      data.name.trim(),
      description:               data.description ?? "",
      billingCodeIds:            data.billingCodeIds,
      requireBillingCode:        data.requireBillingCode === "yes",
      credentialIds:             data.credentialIds,
      billable:                  data.billable === "yes",
      requirePriorAuthorization: data.requirePriorAuthorization === "yes",
      maxBillingCodes:           Number(data.maxBillingCodes),
      color:                     data.color ?? "",
    })

    if (result) router.push(EVENTS_PATH)
  })

  return (
    <form onSubmit={onSubmit}>
      {/* General */}
      <Card variant="elevated" padding="lg">
        <div>
          <button
            type="button"
            onClick={() => setGeneralExpanded(!generalExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">General</h3>
                <p className="text-sm text-gray-500">Basic identification for this event type</p>
              </div>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", generalExpanded && "rotate-180")} />
          </button>

          {generalExpanded && (
            <div className="flex flex-col gap-4">
              <FloatingInput
                label="Name"
                value={w.name}
                onChange={(v) => setValue("name", v)}
                onBlur={() => form.trigger("name")}
                hasError={!!errors.name}
                required
              />
              <FloatingTextarea
                label="Description"
                value={w.description ?? ""}
                onChange={(v) => setValue("description", v)}
                onBlur={() => form.trigger("description")}
                hasError={!!errors.description}
                maxLength={500}
                rows={3}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Configuration */}
      <Card variant="elevated" padding="lg" className="mt-4">
        <div>
          <button
            type="button"
            onClick={() => setConfigExpanded(!configExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Settings className="w-5 h-5 text-blue-700" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">Configuration</h3>
                <p className="text-sm text-gray-500">Rules and constraints for service plan events</p>
              </div>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", configExpanded && "rotate-180")} />
          </button>

          {configExpanded && (
            <div className="space-y-6">
              {/* Row 1: Billing codes + Max billing codes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <MultiSelect
                    label="Allowed billing codes"
                    value={w.billingCodeIds}
                    onChange={(v) => setValue("billingCodeIds", v)}
                    onBlur={() => form.trigger("billingCodeIds")}
                    options={billingCodeOptions}
                    searchable
                    disabled={isLoadingBillingCodes}
                    tone="neutral"
                    maxVisibleTags={3}
                  />
                </div>
                <FloatingInput
                  label="Max billing codes"
                  value={w.maxBillingCodes}
                  onChange={(v) => setValue("maxBillingCodes", v.replace(/\D/g, ""))}
                  onBlur={() => form.trigger("maxBillingCodes")}
                  hasError={!!errors.maxBillingCodes}
                  inputMode="numeric"
                  required
                />
              </div>

              {/* Row 2: Credentials */}
              <div className="grid grid-cols-1 gap-4">
                <MultiSelect
                  label="Allowed credentials"
                  value={w.credentialIds}
                  onChange={(v) => setValue("credentialIds", v)}
                  onBlur={() => form.trigger("credentialIds")}
                  options={credentialOptions}
                  searchable
                  disabled={isLoadingCredentials}
                  tone="neutral"
                  maxVisibleTags={4}
                />
              </div>

              {/* Row 3: Rules & Color */}
              <div className="pt-6 mt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarClock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Rules & Restrictions</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Switches — 2/3 */}
                  <div className="md:col-span-2 divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                    {SWITCH_ITEMS.map((item) => (
                      <label
                        key={item.field}
                        className="flex items-start justify-between gap-4 px-4 py-3 bg-white hover:bg-gray-50/60 transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-900">{item.label}</span>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                        <SwitchPrimitives.Root
                          checked={w[item.field] === "yes"}
                          onCheckedChange={(v: boolean) => setValue(item.field, v ? "yes" : "no")}
                          className={cn(
                            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors shadow-sm",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            w[item.field] === "yes" ? "bg-[#037ECC] hover:bg-[#026fb8]" : "bg-gray-200 hover:bg-gray-300"
                          )}
                        >
                          <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
                        </SwitchPrimitives.Root>
                      </label>
                    ))}
                  </div>

                  {/* Color picker — 1/3 */}
                  <div className="flex flex-col gap-2">
                    <FloatingColorPicker
                      label="Color"
                      value={w.color ?? ""}
                      onChange={(v) => setValue("color", v)}
                      onBlur={() => form.trigger("color")}
                      hasError={!!errors.color}
                    />
                    <p className="text-xs text-slate-400">
                      Used to identify this event type in calendar views
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <FormBottomBar
        isSubmitting={isSaving}
        onCancel={() => router.push(EVENTS_PATH)}
        cancelText="Back"
        submitText="Save changes"
      />
    </form>
  )
}
