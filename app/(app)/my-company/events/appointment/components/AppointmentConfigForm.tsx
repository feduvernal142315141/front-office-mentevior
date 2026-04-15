"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { CalendarClock, Settings } from "lucide-react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Card } from "@/components/custom/Card"
import { FormBottomBar } from "@/components/custom/FormBottomBar"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { FloatingColorPicker } from "@/components/custom/FloatingColorPicker"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { useUpsertAppointmentConfig } from "@/lib/modules/appointment-config/hooks/use-upsert-appointment-config"
import { useTimingCatalog } from "@/lib/modules/timing/hooks/use-timing-catalog"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useBillingCodesVisibleTags } from "@/lib/hooks/use-billing-codes-visible-tags"
import {
  appointmentConfigSchema,
  getAppointmentConfigDefaults,
  type AppointmentConfigFormValues,
} from "@/lib/schemas/appointment-config-form.schema"
import type { AppointmentConfig } from "@/lib/types/appointment-config.types"
import { cn } from "@/lib/utils"

const EVENTS_PATH = "/my-company/events"

const ROUNDING_OPTIONS = [
  { value: "Round", label: "Round" },
  { value: "Floor", label: "Floor" },
  { value: "Ceil",  label: "Ceil" },
]

const SUBEVENT_OPTIONS = [
  { value: "", label: "None" },
  { value: "supervision", label: "Supervisión" },
]

type SwitchField = keyof Pick<
  AppointmentConfigFormValues,
  | "requiredSignature"
  | "requiredPriorAuthorization"
  | "requiredDataCollection"
  | "requiredLocation"
  | "requiredUser"
  | "allowSignature"
  | "allowChangeUser"
  | "allowCreateByUser"
  | "allowEditByUser"
  | "allowNewLocation"
  | "allowedCredentials"
  | "billable"
  | "invoiceable"
  | "showEventInfo"
  | "showPreview"
  | "active"
>

const SWITCH_ITEMS: { label: string; description?: string; field: SwitchField }[] = [
  { label: "Active",                       field: "active" },
  { label: "Allow change user",            field: "allowChangeUser" },
  { label: "Allow create by user",         field: "allowCreateByUser" },
  { label: "Allow credentials",            field: "allowedCredentials" },
  { label: "Allow edit by user",           field: "allowEditByUser" },
  { label: "Allow new location",           field: "allowNewLocation" },
  { label: "Allow signature",              field: "allowSignature" },
  { label: "Billable",                     field: "billable" },
  { label: "Invoiceable",                  field: "invoiceable" },
  { label: "Require data collection",      field: "requiredDataCollection" },
  { label: "Require location",             field: "requiredLocation" },
  { label: "Require prior authorization",  field: "requiredPriorAuthorization" },
  { label: "Require signature",            field: "requiredSignature" },
  { label: "Require user",                 field: "requiredUser" },
  { label: "Show event info",              field: "showEventInfo" },
  { label: "Show preview in calendar",     field: "showPreview" },
]

interface AppointmentConfigFormProps {
  config: AppointmentConfig | null
}

export function AppointmentConfigForm({ config }: AppointmentConfigFormProps) {
  const router = useRouter()
  const { upsert, isLoading: isSaving } = useUpsertAppointmentConfig()
  const { billingCodes, isLoading: isLoadingBillingCodes } = useBillingCodes({ page: 0, pageSize: 100 })
  const { timings, isLoading: isLoadingTimings } = useTimingCatalog()
  const billingCodesVisibleTags = useBillingCodesVisibleTags()

  const billingCodeOptions = billingCodes.map((bc) => ({ value: bc.id, label: bc.code }))
  const timingOptions      = timings.map((t) => ({ value: t.id, label: t.name }))

  const form = useForm<AppointmentConfigFormValues>({
    resolver: zodResolver(appointmentConfigSchema),
    defaultValues: getAppointmentConfigDefaults(),
    mode: "onBlur",
  })

  const { handleSubmit, watch, setValue, formState: { errors } } = form

  useEffect(() => {
    if (!config) return
    form.reset({
      // Scheduling
      leadTimeId:      config.leadTimeId,
      lagTimeId:       config.lagTimeId,
      startTime:       config.startTime,
      endTime:         config.endTime,
      allowedDays:     config.allowedDays,
      allowedSubEvents: config.allowedSubEvents,

      // Numeric limits
      maxNumberLocations:               String(config.maxNumberLocations),
      minDuration:                      String(config.minDuration),
      maxDurationEvent:                 String(config.maxDurationEvent),
      maxDurationPerDayClient:          String(config.maxDurationPerDayClient),
      maxDurationPerDayProvider:        String(config.maxDurationPerDayProvider),
      maxDurationPerWeekClient:         String(config.maxDurationPerWeekClient),
      maxDurationPerWeekProvider:       String(config.maxDurationPerWeekProvider),
      maxDurationConsecutiveDaysClient:   String(config.maxDurationConsecutiveDaysClient),
      maxDurationConsecutiveDaysProvider: String(config.maxDurationConsecutiveDaysProvider),

      // Billing
      billingCodes: config.billingCodes,

      // Switches
      requiredSignature:          config.requiredSignature,
      requiredPriorAuthorization: config.requiredPriorAuthorization,
      requiredDataCollection:     config.requiredDataCollection,
      requiredLocation:           config.requiredLocation,
      requiredUser:               config.requiredUser,
      allowSignature:             config.allowSignature,
      allowChangeUser:            config.allowChangeUser,
      allowCreateByUser:          config.allowCreateByUser,
      allowEditByUser:            config.allowEditByUser,
      allowNewLocation:           config.allowNewLocation,
      allowedCredentials:         config.allowedCredentials,
      billable:                   config.billable,
      invoiceable:                config.invoiceable,
      showEventInfo:              config.showEventInfo,
      showPreview:                config.showPreview,
      active:                     config.active,

      // Appearance
      color: config.color ?? "",
      roundingFunction: config.roundingFunction ?? "Round",
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

      // appointmentName / appointmentDescription not in form (commented out per HU)
      appointmentName:        config?.appointmentName ?? "",
      appointmentDescription: config?.appointmentDescription ?? "",

      // Scheduling
      leadTimeId:      data.leadTimeId,
      lagTimeId:       data.lagTimeId,
      startTime:       data.startTime,
      endTime:         data.endTime,
      allowedDays:     data.allowedDays,
      allowedSubEvents: data.allowedSubEvents,

      // Numeric limits
      maxNumberLocations:               Number(data.maxNumberLocations),
      minDuration:                      Number(data.minDuration),
      maxDurationEvent:                 Number(data.maxDurationEvent),
      maxDurationPerDayClient:          Number(data.maxDurationPerDayClient),
      maxDurationPerDayProvider:        Number(data.maxDurationPerDayProvider),
      maxDurationPerWeekClient:         Number(data.maxDurationPerWeekClient),
      maxDurationPerWeekProvider:       Number(data.maxDurationPerWeekProvider),
      maxDurationConsecutiveDaysClient:   Number(data.maxDurationConsecutiveDaysClient),
      maxDurationConsecutiveDaysProvider: Number(data.maxDurationConsecutiveDaysProvider),

      // Billing
      billingCodes: data.billingCodes,

      // Switches — requiredBillingCode y allowOverlapping sin UI, se envían false
      requiredBillingCode:        false,
      requiredSignature:          data.requiredSignature,
      requiredPriorAuthorization: data.requiredPriorAuthorization,
      requiredDataCollection:     data.requiredDataCollection,
      requiredLocation:           data.requiredLocation,
      requiredUser:               data.requiredUser,
      allowOverlapping:           false,
      allowSignature:             data.allowSignature,
      allowChangeUser:            data.allowChangeUser,
      allowCreateByUser:          data.allowCreateByUser,
      allowEditByUser:            data.allowEditByUser,
      allowNewLocation:           data.allowNewLocation,
      allowedCredentials:         data.allowedCredentials,
      billable:                   data.billable,
      invoiceable:                data.invoiceable,
      showEventInfo:              data.showEventInfo,
      showPreview:                data.showPreview,
      active:                     data.active,

      // Appearance
      color: data.color ?? "",
      roundingFunction: data.roundingFunction,
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
                <p className="text-sm text-gray-500">Rules and constraints for appointment scheduling</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">

              {/* Row 1: Scheduling — Lead/Lag + SubEvents */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              </div>

              {/* Row 2: Locations + SubEvents + Billing codes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="w-full">
                  <FloatingInput
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
                <FloatingSelect
                  label="Allowed sub-events"
                  value={w.allowedSubEvents}
                  onChange={(v) => setValue("allowedSubEvents", v)}
                  onBlur={() => form.trigger("allowedSubEvents")}
                  options={SUBEVENT_OPTIONS}
                />
                <div className="md:col-span-2">
                  <MultiSelect
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
                    label="Max consecutive days client"
                    value={w.maxDurationConsecutiveDaysClient}
                    onChange={(v) => setValue("maxDurationConsecutiveDaysClient", v.replace(/\D/g, ""))}
                    onBlur={() => form.trigger("maxDurationConsecutiveDaysClient")}
                    hasError={!!errors.maxDurationConsecutiveDaysClient}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxDurationConsecutiveDaysClient?.message)}
                </div>
                <div className="w-full">
                  <FloatingInput
                    label="Max consecutive days provider"
                    value={w.maxDurationConsecutiveDaysProvider}
                    onChange={(v) => setValue("maxDurationConsecutiveDaysProvider", v.replace(/\D/g, ""))}
                    onBlur={() => form.trigger("maxDurationConsecutiveDaysProvider")}
                    hasError={!!errors.maxDurationConsecutiveDaysProvider}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                  />
                  {renderFieldError(errors.maxDurationConsecutiveDaysProvider?.message)}
                </div>
                <FloatingSelect
                  label="Rounding function"
                  value={w.roundingFunction}
                  onChange={(v) => setValue("roundingFunction", v as "Round" | "Floor" | "Ceil")}
                  onBlur={() => form.trigger("roundingFunction")}
                  options={ROUNDING_OPTIONS}
                  hasError={!!errors.roundingFunction}
                  required
                />
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
