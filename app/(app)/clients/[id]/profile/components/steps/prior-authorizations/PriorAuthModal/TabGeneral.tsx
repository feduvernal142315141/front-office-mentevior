"use client"

import { useEffect } from "react"
import { Controller, type Control, type FieldErrors } from "react-hook-form"
import { FloatingInput } from "@/components/custom/FloatingInput"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import {
  DURATION_INTERVAL_OPTIONS,
  type PriorAuthFormValues,
} from "@/lib/schemas/prior-authorization-form.schema"
import type { ClientInsurance } from "@/lib/types/client-insurance.types"
import { calculateDuration } from "@/lib/utils/prior-auth-utils"
import { cn } from "@/lib/utils"

interface TabGeneralProps {
  control: Control<PriorAuthFormValues>
  errors: FieldErrors<PriorAuthFormValues>
  watch: (field: keyof PriorAuthFormValues) => string
  setValue: (field: keyof PriorAuthFormValues, value: string) => void
  /** Active insurances for the client — only active ones shown */
  insurances: ClientInsurance[]
  isEditMode: boolean
}

export function TabGeneral({
  control,
  errors,
  watch,
  insurances,
  isEditMode,
}: TabGeneralProps) {
  const startDate = watch("startDate")
  const endDate = watch("endDate")
  const interval = watch("durationInterval")

  const duration = calculateDuration(startDate, endDate, interval as "days" | "weeks" | "months")
  const durationDisplay = duration > 0 ? String(duration) : ""

  const insuranceOptions = insurances
    .filter((ins) => ins.isActive)
    .map((ins) => ({ value: ins.id, label: ins.payerName }))

  return (
    <div className="space-y-5">
      {/* Auth Number + Insurance + Diagnosis */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Controller
          name="authNumber"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingInput
                label="Authorization Number"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputMode="numeric"
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <Controller
          name="insuranceId"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Insurance / Payer"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={insuranceOptions}
                hasError={!!fieldState.error}
                required
                searchable={insuranceOptions.length > 5}
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
              {insuranceOptions.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-600">
                  No active insurances found for this client.
                </p>
              )}
            </div>
          )}
        />

        {/* Primary Diagnosis — placeholder, will be wired to client diagnoses */}
        <Controller
          name="primaryDiagnosisId"
          control={control}
          render={({ field }) => (
            <div>
              <FloatingInput
                label="Primary Diagnosis"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="e.g. F84.0"
              />
              <p className="mt-1 text-xs text-slate-400">
                {/* TODO (backend): wire to client diagnoses list */}
                From client&apos;s diagnosis records
              </p>
            </div>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller
          name="startDate"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                label="Start Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                required
              />
            </div>
          )}
        />

        <Controller
          name="endDate"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                label="End Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                required
              />
            </div>
          )}
        />
      </div>

      {/* Duration row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Duration — read only, auto-calculated */}
        <div>
          <div className="relative">
            <div
              className={cn(
                "w-full h-[52px] 2xl:h-[56px] px-4 rounded-[16px] flex items-center",
                "bg-slate-50 border border-slate-200 text-slate-600 text-[15px]",
                "cursor-not-allowed select-none"
              )}
            >
              {durationDisplay}
            </div>
            <label className="absolute left-4 px-1 top-0 -translate-y-1/2 text-xs text-slate-400 bg-white/80 pointer-events-none">
              Duration <span className="text-slate-300">(auto)</span>
            </label>
          </div>
        </div>

        <Controller
          name="durationInterval"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <FloatingSelect
                label="Interval"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={DURATION_INTERVAL_OPTIONS}
                hasError={!!fieldState.error}
                required
              />
              {fieldState.error && (
                <p className="mt-1.5 text-sm text-red-600">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        {/* Status — read-only, shown only in edit mode */}
        {isEditMode && (
          <div>
            <div className="relative">
              <div
                className={cn(
                  "w-full h-[52px] 2xl:h-[56px] px-4 rounded-[16px] flex items-center",
                  "bg-slate-50 border border-slate-200 text-[15px]",
                  "cursor-not-allowed select-none"
                )}
              >
                <span className="text-slate-500 text-sm italic">
                  Calculated automatically
                </span>
              </div>
              <label className="absolute left-4 px-1 top-0 -translate-y-1/2 text-xs text-slate-400 bg-white/80 pointer-events-none">
                Status <span className="text-slate-300">(read-only)</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Approved → Expiring (2mo before expiry) → Expired
            </p>
          </div>
        )}
      </div>

      {/* Request / Response dates */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Controller
          name="requestDate"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                label="Request Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />

        <Controller
          name="responseDate"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <PremiumDatePicker
                label="Response Date"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onClear={() => field.onChange("")}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            </div>
          )}
        />
      </div>

      {/* Comments */}
      <Controller
        name="comments"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Comments
            </label>
            <textarea
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              maxLength={500}
              rows={3}
              placeholder="Enter comments or notes about this authorization"
              className={cn(
                "w-full resize-y rounded-[16px] px-4 py-3 text-sm text-slate-800",
                "bg-gradient-to-b from-[hsl(240_20%_99%)] to-[hsl(240_18%_96%)]",
                "border border-[hsl(240_20%_88%/0.6)]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04)]",
                "placeholder:text-slate-400",
                "focus:outline-none focus:border-[hsl(var(--primary))]",
                "focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_0_4px_hsl(var(--primary)/0.12)]",
                "transition-all duration-200",
                fieldState.error && "border-2 border-red-500/70"
              )}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldState.error ? (
                <p className="text-sm text-red-600">{fieldState.error.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-slate-400 text-right">
                {(field.value ?? "").length}/500
              </p>
            </div>
          </div>
        )}
      />
    </div>
  )
}
