"use client"

import { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/custom/Button"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { FloatingTextarea } from "@/components/custom/FloatingTextarea"
import { FloatingTimePicker } from "@/components/custom/FloatingTimePicker"
import { MultiSelect } from "@/components/custom/MultiSelect"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { useModalityCatalog } from "@/lib/modules/appointment-notes/hooks/use-modality-catalog"
import { useParticipantCatalog } from "@/lib/modules/appointment-notes/hooks/use-participant-catalog"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { useActivityCategoryCatalog } from "@/lib/modules/case-supervision-log/hooks/use-activity-category-catalog"
import {
  createEmptyManualEntry,
  getManualEntryDuration,
  getReportMonthBounds,
  type ManualEntryFormValue,
} from "@/lib/modules/case-supervision-log/utils/manual-entries"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import {
  CASE_SUPERVISION_SERVICE_TYPES,
  type CaseSupervisionManualEntry,
} from "@/lib/types/case-supervision-log.types"

interface Option {
  value: string
  label: string
}

interface ManualLogEntryEditorProps {
  entries: ManualEntryFormValue[]
  onChange: (entries: ManualEntryFormValue[]) => void
  clientId: string
  /** `yyyyMM` — acota el Date of Service al mes del reporte */
  reportMonth: string
  /**
   * Entradas ya guardadas. Sus snapshots cubren los valores que ya no están en
   * los catálogos (un billing code desactivado, una dirección borrada), para que
   * el select muestre lo guardado en vez de quedar en blanco.
   */
  savedEntries?: CaseSupervisionManualEntry[]
  /** El `PUT` sólo modifica entradas existentes: al editar no se agrega ni se quita */
  allowAddRemove?: boolean
  disabled?: boolean
}

const SERVICE_TYPE_OPTIONS: Option[] = CASE_SUPERVISION_SERVICE_TYPES.map((type) => ({
  value: type,
  label: type,
}))

/** Agrega al final las opciones guardadas que el catálogo ya no trae */
function withSavedOptions(options: Option[], saved: Option[]): Option[] {
  const known = new Set(options.map((o) => o.value))
  const missing: Option[] = []
  for (const option of saved) {
    if (!option.value || !option.label || known.has(option.value)) continue
    known.add(option.value)
    missing.push(option)
  }
  return missing.length > 0 ? [...options, ...missing] : options
}

function formatHours(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Formulario de las entradas manuales del Case Supervision Log. Ningún campo es
 * obligatorio. Total Time no se escribe: sale de Start Time y End Time.
 */
export function ManualLogEntryEditor({
  entries,
  onChange,
  clientId,
  reportMonth,
  savedEntries = [],
  allowAddRemove = true,
  disabled,
}: ManualLogEntryEditorProps) {
  const { billingCodes } = useBillingCodes({ page: 0, pageSize: 200 })
  const { selectOptions: activityCategoryCatalogOptions } = useActivityCategoryCatalog()
  const { selectOptions: modalityCatalogOptions } = useModalityCatalog()
  const { items: participantCatalog } = useParticipantCatalog()
  const { addresses } = useClientAddresses(clientId || null)

  const { minDate, maxDate } = useMemo(() => getReportMonthBounds(reportMonth), [reportMonth])

  const billingCodeOptions = useMemo(
    () =>
      withSavedOptions(
        billingCodes
          .filter((code) => code.active)
          .map((code) => ({
            value: code.id,
            label: [code.type, code.code, code.modifier].filter(Boolean).join(" "),
          })),
        savedEntries.map((e) => ({ value: e.billingCodeId, label: e.billingCode })),
      ),
    [billingCodes, savedEntries],
  )

  const locationOptions = useMemo(
    () =>
      withSavedOptions(
        addresses.map((address) => {
          const placeOfService = address.placeServiceName ?? address.placeService
          return {
            value: address.id,
            label: [address.nickName, placeOfService].filter(Boolean).join(" · ") || address.addressLine1,
          }
        }),
        savedEntries.map((e) => ({ value: e.clientAddressId, label: e.clientAddressPlaceServiceName })),
      ),
    [addresses, savedEntries],
  )

  const modalityOptions = useMemo(
    () =>
      withSavedOptions(
        modalityCatalogOptions,
        savedEntries.map((e) => ({ value: e.modalityCatalogId, label: e.modalityName })),
      ),
    [modalityCatalogOptions, savedEntries],
  )

  const activityCategoryOptions = useMemo(
    () =>
      withSavedOptions(
        activityCategoryCatalogOptions,
        savedEntries.flatMap((e) => e.activityCategories.map((c) => ({ value: c.id, label: c.name }))),
      ),
    [activityCategoryCatalogOptions, savedEntries],
  )

  const participantOptions = useMemo(
    () =>
      withSavedOptions(
        participantCatalog.map((item) => ({ value: item.id, label: item.name })),
        savedEntries.flatMap((e) =>
          e.participants.map((p) => ({ value: p.catalogId, label: p.catalogName })),
        ),
      ),
    [participantCatalog, savedEntries],
  )

  const update = <K extends keyof ManualEntryFormValue>(
    key: string,
    field: K,
    value: ManualEntryFormValue[K],
  ) => {
    onChange(entries.map((entry) => (entry.key === key ? { ...entry, [field]: value } : entry)))
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => {
        const duration = getManualEntryDuration(entry.timeStart, entry.timeEnd)

        return (
          <div key={entry.key} className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Entry {index + 1}
              </span>
              {allowAddRemove && (
                <button
                  type="button"
                  onClick={() => onChange(entries.filter((e) => e.key !== entry.key))}
                  disabled={disabled}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200/60 bg-gradient-to-b from-red-50 to-red-100/80 text-red-600 transition-all hover:from-red-100 hover:to-red-200/90 disabled:opacity-50"
                  title="Remove entry"
                  aria-label="Remove entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <PremiumDatePicker
                label="Date of Service"
                value={entry.date}
                onChange={(v) => update(entry.key, "date", v)}
                onClear={() => update(entry.key, "date", "")}
                minDate={minDate}
                maxDate={maxDate}
                disabled={disabled}
              />
              <FloatingTimePicker
                label="Start Time"
                value={entry.timeStart}
                onChange={(v) => update(entry.key, "timeStart", v)}
                allowManualInput
                disabled={disabled}
              />
              <FloatingTimePicker
                label="End Time"
                value={entry.timeEnd}
                onChange={(v) => update(entry.key, "timeEnd", v)}
                allowManualInput
                defaultPeriod="PM"
                disabled={disabled}
              />
              <div className="flex h-[52px] 2xl:h-[56px] items-center justify-between rounded-[16px] border border-slate-200 bg-white/60 px-4">
                <span className="text-sm text-slate-500">Total Time (hrs)</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900">
                  {formatHours(duration)}
                </span>
              </div>

              <FloatingSelect
                label="Billing Code"
                value={entry.billingCodeId}
                onChange={(v) => update(entry.key, "billingCodeId", v)}
                options={billingCodeOptions}
                disabled={disabled}
                searchable
              />
              <FloatingSelect
                label="Service Type"
                value={entry.serviceType}
                onChange={(v) => update(entry.key, "serviceType", v)}
                options={SERVICE_TYPE_OPTIONS}
                disabled={disabled}
              />
              <FloatingSelect
                label="Location"
                value={entry.clientAddressId}
                onChange={(v) => update(entry.key, "clientAddressId", v)}
                options={locationOptions}
                disabled={disabled}
                searchable
              />
              <FloatingSelect
                label="Modality"
                value={entry.modalityCatalogId}
                onChange={(v) => update(entry.key, "modalityCatalogId", v)}
                options={modalityOptions}
                disabled={disabled}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
              <MultiSelect
                label="Activity Category"
                value={entry.activityCategoryIds}
                onChange={(v) => update(entry.key, "activityCategoryIds", v)}
                options={activityCategoryOptions}
                disabled={disabled}
                tone="neutral"
                placeholder="Select all that apply"
                maxVisibleTags={4}
              />
              <MultiSelect
                label="Participants"
                value={entry.participantIds}
                onChange={(v) => update(entry.key, "participantIds", v)}
                options={participantOptions}
                disabled={disabled}
                searchable
                tone="neutral"
                placeholder="Select all that apply"
                maxVisibleTags={4}
              />
            </div>

            <div className="mt-4">
              <FloatingTextarea
                label="Description of Activity"
                value={entry.characteristic}
                onChange={(v) => update(entry.key, "characteristic", v)}
                onBlur={() => {}}
                rows={3}
                disabled={disabled}
              />
            </div>
          </div>
        )
      })}

      {allowAddRemove && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange([...entries, createEmptyManualEntry()])}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add entry
        </Button>
      )}
    </div>
  )
}
