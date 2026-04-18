"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react"
import { CalendarClock, Settings } from "lucide-react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Card } from "@/components/custom/Card"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { FloatingColorPicker } from "@/components/custom/FloatingColorPicker"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { useUpsertServicePlanConfig } from "@/lib/modules/service-plan-config/hooks/use-upsert-service-plan-config"
import { useFocusFirstError } from "@/lib/hooks/use-focus-first-error"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useBillingCodesVisibleTagsWide } from "@/lib/hooks/use-billing-codes-visible-tags-wide"
import {
  servicePlanConfigSchema,
  getServicePlanConfigDefaults,
  type ServicePlanConfigFormValues,
} from "@/lib/schemas/service-plan-config-form.schema"
import type { ServicePlanConfig } from "@/lib/types/service-plan-config.types"
import { cn } from "@/lib/utils"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { formatTimeTo24h } from "@/lib/utils/time-format"
import type { EventTimeField } from "@/lib/types/appointment-config.types"

function toTimeField(raw24h: string): EventTimeField {
  const [hStr = "0", mStr = "00"] = raw24h.split(":")
  const h24 = Number(hStr)
  const code: "AM" | "PM" = h24 >= 12 ? "PM" : "AM"
  const h12 = h24 % 12 || 12
  return { code, value: `${String(h12).padStart(2, "0")}:${mStr}` }
}

function fromTimeField(field: EventTimeField | string | undefined): string {
  if (!field) return ""
  if (typeof field === "string") return field
  return formatTimeTo24h(`${field.value} ${field.code}`) ?? ""
}

const EVENTS_PATH = "/my-company/events"

type SwitchField = keyof Pick<
  ServicePlanConfigFormValues,
  | "requiredSignature"
  | "requiredPriorAuthorization"
  | "requiredLocation"
  | "requiredUser"
  | "allowSignature"
  | "allowChangeUser"
  | "allowCreateByUser"
  | "allowEditByUser"
  | "allowNewLocation"
  | "allowedCredentials"
  | "showEventInfo"
  | "showPreview"
  | "active"
>

const SWITCH_ITEMS: { label: string; description?: string; field: SwitchField }[] = [
  { label: "Active",                      field: "active" },
  { label: "Allow change user",           field: "allowChangeUser" },
  { label: "Allow create by user",        field: "allowCreateByUser" },
  { label: "Allow credentials",           field: "allowedCredentials" },
  { label: "Allow edit by user",          field: "allowEditByUser" },
  { label: "Allow new location",          field: "allowNewLocation" },
  { label: "Allow signature",             field: "allowSignature" },
  { label: "Require location",            field: "requiredLocation" },
  { label: "Require prior authorization", field: "requiredPriorAuthorization" },
  { label: "Require signature",           field: "requiredSignature" },
  { label: "Require user",               field: "requiredUser" },
  { label: "Show event info",             field: "showEventInfo" },
  { label: "Show preview in calendar",    field: "showPreview" },
]

interface ServicePlanConfigFormProps {
  config: ServicePlanConfig | null
}

export function ServicePlanConfigForm({ config }: ServicePlanConfigFormProps) {
  const router = useRouter()
  const { upsert, isLoading: isSaving } = useUpsertServicePlanConfig()
  const { billingCodes, isLoading: isLoadingBillingCodes } = useBillingCodes({ page: 0, pageSize: 100 })
  const billingCodesVisibleTags = useBillingCodesVisibleTagsWide()

  const billingCodeOptions = billingCodes.map((bc) => ({
    value: bc.id,
    label: formatBillingCodeDisplay({ type: bc.type, code: bc.code, modifier: bc.modifier }),
    tagLabel: bc.code,
  }))

  const form = useForm<ServicePlanConfigFormValues>({
    resolver: zodResolver(servicePlanConfigSchema),
    defaultValues: getServicePlanConfigDefaults(),
    mode: "onChange",
  })

  const { handleSubmit, watch, setValue: baseSetValue, formState: { errors, submitCount } } = form
  // Wrapper so every programmatic change re-runs validation (true onChange UX).
  const setValue: typeof baseSetValue = (name, value, options) =>
    baseSetValue(name, value, { shouldValidate: true, shouldDirty: true, ...options })

  const refStartTime      = useRef<HTMLButtonElement>(null)
  const refEndTime        = useRef<HTMLButtonElement>(null)
  const refMaxLocations   = useRef<HTMLInputElement>(null)
  const refBillingCodes   = useRef<HTMLButtonElement>(null)
  const refMinDuration    = useRef<HTMLInputElement>(null)
  const refMaxDuration    = useRef<HTMLInputElement>(null)
  const refDayClient      = useRef<HTMLInputElement>(null)
  const refDayProvider    = useRef<HTMLInputElement>(null)
  const refWeekClient     = useRef<HTMLInputElement>(null)
  const refWeekProvider   = useRef<HTMLInputElement>(null)
  const refConsecClient   = useRef<HTMLInputElement>(null)
  const refConsecProvider = useRef<HTMLInputElement>(null)

  useFocusFirstError(errors, submitCount, [
    { key: "startTime",                       ref: refStartTime },
    { key: "endTime",                         ref: refEndTime },
    { key: "maxNumberLocations",              ref: refMaxLocations },
    { key: "billingCodes",                    ref: refBillingCodes },
    { key: "minDuration",                     ref: refMinDuration },
    { key: "maxDurationEvent",                ref: refMaxDuration },
    { key: "maxDurationPerDayClient",         ref: refDayClient },
    { key: "maxDurationPerDayProvider",       ref: refDayProvider },
    { key: "maxDurationPerWeekClient",        ref: refWeekClient },
    { key: "maxDurationPerWeekProvider",      ref: refWeekProvider },
    { key: "maxAllowedDaysClient",   ref: refConsecClient },
    { key: "maxAllowedDaysProvider", ref: refConsecProvider },
  ])

  useEffect(() => {
    if (!config) return
    form.reset({
      // Scheduling
      startTime: fromTimeField(config.startTime),
      endTime:   fromTimeField(config.endTime),

      // Numeric limits
      maxNumberLocations:               String(config.maxNumberLocations),
      minDuration:                      String(config.minDuration),
      maxDurationEvent:                 String(config.maxDurationEvent),
      maxDurationPerDayClient:          String(config.maxDurationPerDayClient),
      maxDurationPerDayProvider:        String(config.maxDurationPerDayProvider),
      maxDurationPerWeekClient:         String(config.maxDurationPerWeekClient),
      maxDurationPerWeekProvider:       String(config.maxDurationPerWeekProvider),
      maxAllowedDaysClient:   String(config.maxAllowedDaysClient),
      maxAllowedDaysProvider: String(config.maxAllowedDaysProvider),

      // Billing
      billingCodes: config.billingCodes ?? [],

      // Switches
      requiredSignature:          config.requiredSignature,
      requiredPriorAuthorization: config.requiredPriorAuthorization,
      requiredLocation:           config.requiredLocation,
      requiredUser:               config.requiredUser,
      allowSignature:             config.allowSignature,
      allowChangeUser:            config.allowChangeUser,
      allowCreateByUser:          config.allowCreateByUser,
      allowEditByUser:            config.allowEditByUser,
      allowNewLocation:           config.allowNewLocation,
      allowedCredentials:         config.allowedCredentials,
      showEventInfo:              config.showEventInfo,
      showPreview:                config.showPreview,
      active:                     config.active,

      // Appearance
      color: config.color ?? "",
    })
  }, [config, form])

  const w = watch()
  const renderFieldError = (message?: string) =>
    message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null
  const sanitizeDecimalInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "")
    const [integerPart, ...decimalParts] = cleaned.split(".")
    const normalized = decimalParts.length > 0
      ? `${integerPart}.${decimalParts.join("")}`
      : integerPart

    return normalized.startsWith(".") ? `0${normalized}` : normalized
  }

  const onSubmit = handleSubmit(async (data) => {
    const result = await upsert({
      ...(config?.id ? { id: config.id } : {}),

      // servicePlanName / servicePlanDescription not in form (commented out per HU)
      servicePlanName:        config?.servicePlanName ?? "",
      servicePlanDescription: config?.servicePlanDescription ?? "",

      // Scheduling
      startTime: toTimeField(data.startTime),
      endTime:   toTimeField(data.endTime),

      // Numeric limits
      maxNumberLocations:               Number(data.maxNumberLocations),
      minDuration:                      Number(data.minDuration),
      maxDurationEvent:                 Number(data.maxDurationEvent),
      maxDurationPerDayClient:          Number(data.maxDurationPerDayClient),
      maxDurationPerDayProvider:        Number(data.maxDurationPerDayProvider),
      maxDurationPerWeekClient:         Number(data.maxDurationPerWeekClient),
      maxDurationPerWeekProvider:       Number(data.maxDurationPerWeekProvider),
      maxAllowedDaysClient:   Number(data.maxAllowedDaysClient),
      maxAllowedDaysProvider: Number(data.maxAllowedDaysProvider),

      // Billing
      billingCodes: data.billingCodes,

      // Switches — requiredBillingCode y allowOverlapping sin UI, se envían false
      requiredBillingCode:        false,
      requiredSignature:          data.requiredSignature,
      requiredPriorAuthorization: data.requiredPriorAuthorization,
      requiredLocation:           data.requiredLocation,
      requiredUser:               data.requiredUser,
      allowOverlapping:           false,
      allowSignature:             data.allowSignature,
      allowChangeUser:            data.allowChangeUser,
      allowCreateByUser:          data.allowCreateByUser,
      allowEditByUser:            data.allowEditByUser,
      allowNewLocation:           data.allowNewLocation,
      allowedCredentials:         data.allowedCredentials,
      showEventInfo:              data.showEventInfo,
      showPreview:                data.showPreview,
      active:                     data.active,

      // Appearance
      color: data.color ?? "",
    })

    if (result) router.push(EVENTS_PATH)
  })

  return (
    <form onSubmit={onSubmit}>
      {/* ── General (commented out — no name/description for now) ─────────────
      <Card variant="elevated" padding="lg">
        General section placeholder
      </Card>
      ──────────────────────────────────────────────────────────────────────── */}

      {/* ── Configuration ──────────────────────────────────────────────────── */}
      <Card variant="elevated" padding="lg">
        <div>
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Settings className="w-5 h-5 text-blue-700" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">Configuration</h3>
                <p className="text-sm text-gray-500">Rules and constraints for service plan events</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">

              {/* Row 1: Time window */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <FloatingTimePicker
                    ref={refStartTime}
                    label="Start time"
                    value={w.startTime}
                    onChange={(v) => setValue("startTime", v)}
                    onBlur={() => form.trigger("startTime")}
                    hasError={!!errors.startTime}
                    allowManualInput
                    required
                  />
                  <p className="mt-1 px-1 text-xs text-gray-500">Type hh:mm and pick AM/PM.</p>
                  {renderFieldError(errors.startTime?.message)}
                </div>
                <div>
                  <FloatingTimePicker
                    ref={refEndTime}
                    label="End time"
                    value={w.endTime}
                    onChange={(v) => setValue("endTime", v)}
                    onBlur={() => form.trigger("endTime")}
                    hasError={!!errors.endTime}
                    allowManualInput
                    required
                  />
                  <p className="mt-1 px-1 text-xs text-gray-500">Type hh:mm and pick AM/PM.</p>
                  {renderFieldError(errors.endTime?.message)}
                </div>
              </div>

              {/* Row 2: Locations + Billing codes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="w-full">
                  <FloatingInput
                    ref={refMaxLocations}
                    label="Max locations"
                    value={w.maxNumberLocations}
                    onChange={(v) => setValue("maxNumberLocations", v.replace(/\D/g, ""))}
                    onBlur={() => form.trigger("maxNumberLocations")}
                    hasError={!!errors.maxNumberLocations}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxNumberLocations?.message)}
                </div>
                <div className="md:col-span-3">
                  <MultiSelect
                    ref={refBillingCodes}
                    label="Billing codes"
                    value={w.billingCodes}
                    onChange={(v) => setValue("billingCodes", v)}
                    onBlur={() => form.trigger("billingCodes")}
                    options={billingCodeOptions}
                    hasError={!!errors.billingCodes}
                    searchable
                    disabled={isLoadingBillingCodes}
                    tone="neutral"
                    maxVisibleTags={billingCodesVisibleTags}
                    required
                  />
                  {errors.billingCodes?.message && (
                    <p className="mt-1 text-xs text-red-600">{errors.billingCodes.message}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Duration — event level + Color */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="w-full">
                  <FloatingInput
                    ref={refMinDuration}
                    label="Min duration event (h)"
                    value={w.minDuration}
                    onChange={(v) => setValue("minDuration", sanitizeDecimalInput(v))}
                    onBlur={() => form.trigger("minDuration")}
                    hasError={!!errors.minDuration}
                    inputMode="decimal"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.minDuration?.message)}
                </div>
                <div className="w-full">
                  <FloatingInput
                    ref={refMaxDuration}
                    label="Max duration event (h)"
                    value={w.maxDurationEvent}
                    onChange={(v) => setValue("maxDurationEvent", sanitizeDecimalInput(v))}
                    onBlur={() => form.trigger("maxDurationEvent")}
                    hasError={!!errors.maxDurationEvent}
                    inputMode="decimal"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxDurationEvent?.message)}
                </div>
                <div className="self-start">
                  <FloatingColorPicker
                    label="Color"
                    value={w.color ?? ""}
                    onChange={(v) => setValue("color", v)}
                    onBlur={() => form.trigger("color")}
                    hasError={!!errors.color}
                  />
                </div>
              </div>

              {/* Row 4: Duration — per day */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="w-full">
                  <FloatingInput
                    ref={refDayClient}
                    label="Max duration / day client (h)"
                    value={w.maxDurationPerDayClient}
                    onChange={(v) => setValue("maxDurationPerDayClient", sanitizeDecimalInput(v))}
                    onBlur={() => form.trigger("maxDurationPerDayClient")}
                    hasError={!!errors.maxDurationPerDayClient}
                    inputMode="decimal"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxDurationPerDayClient?.message)}
                </div>
                <div className="w-full">
                  <FloatingInput
                    ref={refDayProvider}
                    label="Max duration / day provider (h)"
                    value={w.maxDurationPerDayProvider}
                    onChange={(v) => setValue("maxDurationPerDayProvider", sanitizeDecimalInput(v))}
                    onBlur={() => form.trigger("maxDurationPerDayProvider")}
                    hasError={!!errors.maxDurationPerDayProvider}
                    inputMode="decimal"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxDurationPerDayProvider?.message)}
                </div>
                <div className="w-full">
                  <FloatingInput
                    ref={refWeekClient}
                    label="Max duration / week client (h)"
                    value={w.maxDurationPerWeekClient}
                    onChange={(v) => setValue("maxDurationPerWeekClient", sanitizeDecimalInput(v))}
                    onBlur={() => form.trigger("maxDurationPerWeekClient")}
                    hasError={!!errors.maxDurationPerWeekClient}
                    inputMode="decimal"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxDurationPerWeekClient?.message)}
                </div>
                <div className="w-full">
                  <FloatingInput
                    ref={refWeekProvider}
                    label="Max duration / week provider (h)"
                    value={w.maxDurationPerWeekProvider}
                    onChange={(v) => setValue("maxDurationPerWeekProvider", sanitizeDecimalInput(v))}
                    onBlur={() => form.trigger("maxDurationPerWeekProvider")}
                    hasError={!!errors.maxDurationPerWeekProvider}
                    inputMode="decimal"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxDurationPerWeekProvider?.message)}
                </div>
              </div>

              {/* Row 5: Consecutive days + Rounding */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="w-full">
                  <FloatingInput
                    ref={refConsecClient}
                    label="Max days allowed per client"
                    value={w.maxAllowedDaysClient}
                    onChange={(v) => setValue("maxAllowedDaysClient", v.replace(/\D/g, ""))}
                    onBlur={() => form.trigger("maxAllowedDaysClient")}
                    hasError={!!errors.maxAllowedDaysClient}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxAllowedDaysClient?.message)}
                </div>
                <div className="w-full">
                  <FloatingInput
                    ref={refConsecProvider}
                    label="Max days allowed per provider"
                    value={w.maxAllowedDaysProvider}
                    onChange={(v) => setValue("maxAllowedDaysProvider", v.replace(/\D/g, ""))}
                    onBlur={() => form.trigger("maxAllowedDaysProvider")}
                    hasError={!!errors.maxAllowedDaysProvider}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxAllowedDaysProvider?.message)}
                </div>
              </div>

              {/* Row 6: Rules & Restrictions ─────────────────────────────── */}
              <div className="pt-6 mt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarClock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Rules & Restrictions</span>
                </div>
                {/* 2 columnas al 50% — orden alfabético continuo izq→der */}
                <div className="flex flex-col md:flex-row gap-x-24">
                  {[SWITCH_ITEMS.slice(0, Math.ceil(SWITCH_ITEMS.length / 2)), SWITCH_ITEMS.slice(Math.ceil(SWITCH_ITEMS.length / 2))].map((col, colIdx) => (
                    <div key={colIdx} className="flex-1">
                      {col.map((item) => (
                        <label
                          key={item.field}
                          className="flex items-start justify-between gap-4 px-4 py-3 border-b border-gray-100 bg-white hover:bg-gray-50/60 transition-colors cursor-pointer"
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
                  ))}
                </div>
              </div>

          </div>
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
