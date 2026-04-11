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
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { FloatingColorPicker } from "@/components/custom/FloatingColorPicker"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { useUpdateAppointmentConfig } from "@/lib/modules/appointment-config/hooks/use-update-appointment-config"
import { useTimingCatalog } from "@/lib/modules/timing/hooks/use-timing-catalog"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import {
  appointmentConfigSchema,
  getAppointmentConfigDefaults,
  type AppointmentConfigFormValues,
} from "@/lib/schemas/appointment-config-form.schema"
import type { AppointmentConfig } from "@/lib/types/appointment-config.types"
import { cn } from "@/lib/utils"

const EVENTS_PATH = "/my-company/events"

const SUBEVENT_OPTIONS = [
  { value: "supervision", label: "Supervisión" },
]

const SWITCH_ITEMS: {
  label: string
  description?: string
  field: "requiredBillingCode" | "requiredSignature" | "requiredPriorAuthorization" | "allowOverlapping"
}[] = [
  { label: "Require billing codes",      field: "requiredBillingCode" },
  { label: "Require signature",          field: "requiredSignature" },
  { label: "Require prior authorization", field: "requiredPriorAuthorization" },
  {
    label: "Allow overlapping (Provider)",
    description: "No overlapping of services, except supervision",
    field: "allowOverlapping",
  },
]

interface AppointmentConfigFormProps {
  config: AppointmentConfig | null
}

export function AppointmentConfigForm({ config }: AppointmentConfigFormProps) {
  const router = useRouter()
  const { update, isLoading: isSaving } = useUpdateAppointmentConfig()
  const { billingCodes, isLoading: isLoadingBillingCodes } = useBillingCodes({ page: 0, pageSize: 100 })
  const { timings, isLoading: isLoadingTimings } = useTimingCatalog()
  const [generalExpanded, setGeneralExpanded] = useState(true)
  const [configExpanded, setConfigExpanded] = useState(true)

  const billingCodeOptions = billingCodes.map((bc) => ({
    value: bc.id,
    label: bc.code,
  }))

  const timingOptions = timings.map((t) => ({
    value: t.id,
    label: t.name,
  }))

  const form = useForm<AppointmentConfigFormValues>({
    resolver: zodResolver(appointmentConfigSchema),
    defaultValues: getAppointmentConfigDefaults(),
    mode: "onBlur",
  })

  const { handleSubmit, watch, setValue, formState: { errors } } = form

  useEffect(() => {
    if (!config) return
    form.reset({
      name:                   config.name ?? "",
      description:            config.description ?? "",
      maxNumberLocations:     String(config.maxNumberLocations),
      requiredBillingCode:    config.requiredBillingCode,
      requiredSignature:      config.requiredSignature,
      allowSubEvents:         config.allowSubEvents,
      requiredPriorAuthorization: config.requiredPriorAuthorization,
      leadTimeId:             config.leadTimeId,
      lagTimeId:              config.lagTimeId,
      startTime:              config.startTime,
      endTime:                config.endTime,
      allowOverlapping:       config.allowOverlapping,
      billingCodes:           config.billingCodes,
      maxDurationPerProvider: String(config.maxDurationPerProvider),
      maxDurationPerClient:   String(config.maxDurationPerClient),
      maxDurationRBTAndAnalyst: String(config.maxDurationRBTAndAnalyst),
      maxConsecutiveDaysOfWork: String(config.maxConsecutiveDaysOfWork),
      color:                  config.color ?? "",
    })
  }, [config, form])

  const w = watch()

  const onSubmit = handleSubmit(async (data) => {
    const result = await update({
      ...(config?.id ? { id: config.id } : {}),
      name:                     data.name.trim(),
      description:              data.description ?? "",
      maxNumberLocations:       Number(data.maxNumberLocations),
      requiredBillingCode:      data.requiredBillingCode,
      requiredSignature:        data.requiredSignature,
      allowSubEvents:           data.allowSubEvents,
      requiredPriorAuthorization: data.requiredPriorAuthorization,
      leadTimeId:               data.leadTimeId,
      lagTimeId:                data.lagTimeId,
      startTime:                data.startTime,
      endTime:                  data.endTime,
      allowOverlapping:         data.allowOverlapping,
      billingCodes:             data.billingCodes,
      maxDurationPerProvider:   Number(data.maxDurationPerProvider),
      maxDurationPerClient:     Number(data.maxDurationPerClient),
      maxDurationRBTAndAnalyst: Number(data.maxDurationRBTAndAnalyst),
      maxConsecutiveDaysOfWork: Number(data.maxConsecutiveDaysOfWork),
      color:                    data.color ?? "",
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
                <p className="text-sm text-gray-500">Rules and constraints for appointment scheduling</p>
              </div>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", configExpanded && "rotate-180")} />
          </button>

          {configExpanded && (
            <div className="space-y-6">
              {/* Row 1: Scheduling constraints */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FloatingInput
                  label="Max locations"
                  value={w.maxNumberLocations}
                  onChange={(v) => setValue("maxNumberLocations", v.replace(/\D/g, ""))}
                  onBlur={() => form.trigger("maxNumberLocations")}
                  hasError={!!errors.maxNumberLocations}
                  inputMode="numeric"
                  required
                />
                <FloatingSelect
                  label="Allowed Sub-Events"
                  value={w.allowSubEvents}
                  onChange={(v) => setValue("allowSubEvents", v)}
                  onBlur={() => form.trigger("allowSubEvents")}
                  options={SUBEVENT_OPTIONS}
                  hasError={!!errors.allowSubEvents}
                  required
                />
                <FloatingSelect
                  label="Lead time"
                  value={w.leadTimeId}
                  onChange={(v) => setValue("leadTimeId", v)}
                  onBlur={() => form.trigger("leadTimeId")}
                  options={timingOptions}
                  hasError={!!errors.leadTimeId}
                  disabled={isLoadingTimings}
                  required
                />
                <FloatingSelect
                  label="Lag time"
                  value={w.lagTimeId}
                  onChange={(v) => setValue("lagTimeId", v)}
                  onBlur={() => form.trigger("lagTimeId")}
                  options={timingOptions}
                  hasError={!!errors.lagTimeId}
                  disabled={isLoadingTimings}
                  required
                />
              </div>

              {/* Row 2: Time window + Billing codes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FloatingTimePicker
                  label="Start time"
                  value={w.startTime}
                  onChange={(v) => setValue("startTime", v)}
                  onBlur={() => form.trigger("startTime")}
                  hasError={!!errors.startTime}
                  required
                />
                <FloatingTimePicker
                  label="End time"
                  value={w.endTime}
                  onChange={(v) => setValue("endTime", v)}
                  onBlur={() => form.trigger("endTime")}
                  hasError={!!errors.endTime}
                  required
                />
                <div className="md:col-span-2">
                  <MultiSelect
                    label="Billing codes"
                    value={w.billingCodes}
                    onChange={(v) => setValue("billingCodes", v)}
                    onBlur={() => form.trigger("billingCodes")}
                    options={billingCodeOptions}
                    searchable
                    disabled={isLoadingBillingCodes}
                    tone="neutral"
                    maxVisibleTags={2}
                  />
                </div>
              </div>

              {/* Row 3: Duration limits */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FloatingInput
                  label="Max duration / provider (h)"
                  value={w.maxDurationPerProvider}
                  onChange={(v) => setValue("maxDurationPerProvider", v.replace(/\D/g, ""))}
                  onBlur={() => form.trigger("maxDurationPerProvider")}
                  hasError={!!errors.maxDurationPerProvider}
                  inputMode="numeric"
                  required
                />
                <FloatingInput
                  label="Max duration / client (h)"
                  value={w.maxDurationPerClient}
                  onChange={(v) => setValue("maxDurationPerClient", v.replace(/\D/g, ""))}
                  onBlur={() => form.trigger("maxDurationPerClient")}
                  hasError={!!errors.maxDurationPerClient}
                  inputMode="numeric"
                  required
                />
                <FloatingInput
                  label="Max duration RBT & analyst (h)"
                  value={w.maxDurationRBTAndAnalyst}
                  onChange={(v) => setValue("maxDurationRBTAndAnalyst", v.replace(/\D/g, ""))}
                  onBlur={() => form.trigger("maxDurationRBTAndAnalyst")}
                  hasError={!!errors.maxDurationRBTAndAnalyst}
                  inputMode="numeric"
                  required
                />
                <FloatingInput
                  label="Max consecutive days"
                  value={w.maxConsecutiveDaysOfWork}
                  onChange={(v) => setValue("maxConsecutiveDaysOfWork", v.replace(/\D/g, ""))}
                  onBlur={() => form.trigger("maxConsecutiveDaysOfWork")}
                  hasError={!!errors.maxConsecutiveDaysOfWork}
                  inputMode="numeric"
                  required
                />
              </div>

              {/* Row 4: Rules & Color */}
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
                          checked={w[item.field]}
                          onCheckedChange={(v: boolean) => setValue(item.field, v)}
                          className={cn(
                            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors shadow-sm",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            w[item.field] ? "bg-[#037ECC] hover:bg-[#026fb8]" : "bg-gray-200 hover:bg-gray-300"
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
