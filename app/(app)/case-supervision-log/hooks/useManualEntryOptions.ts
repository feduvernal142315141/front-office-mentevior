"use client"

import { useCallback, useMemo } from "react"
import { useModalityCatalog } from "@/lib/modules/appointment-notes/hooks/use-modality-catalog"
import { useParticipantCatalog } from "@/lib/modules/appointment-notes/hooks/use-participant-catalog"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import { formatBillingCodeDisplay } from "@/lib/utils/billing-code-display"
import { useActivityCategoryCatalog } from "@/lib/modules/case-supervision-log/hooks/use-activity-category-catalog"
import {
  getManualEntryDuration,
  type ManualEntryFormValue,
} from "@/lib/modules/case-supervision-log/utils/manual-entries"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import {
  getServiceTypeForBillingCode,
  type CaseSupervisionManualEntry,
} from "@/lib/types/case-supervision-log.types"

export interface Option {
  value: string
  label: string
}

/** Una fila de la tabla de entradas manuales, ya resuelta a textos */
export interface ManualEntryRow {
  key: string
  date: string
  timeStart: string
  timeEnd: string
  duration: number
  billingCode: string
  serviceType: string
  activityCategories: string[]
  participants: string[]
  location: string
  modality: string
  description: string
}

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

function labelOf(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? ""
}

function formatPlaceServiceLabel(name?: string, code?: string, fallback = ""): string {
  const placeServiceName = name?.trim() ?? ""
  const placeServiceCode = code?.trim() ?? ""
  if (placeServiceName && placeServiceCode) return `${placeServiceName} (${placeServiceCode})`
  return placeServiceName || placeServiceCode || fallback
}

/**
 * Catálogos de las entradas manuales y la resolución de ids a textos para la
 * tabla. Los snapshots de `savedEntries` cubren lo que ya no está en los
 * catálogos (un billing code desactivado, una dirección borrada), para que se
 * vea lo guardado en vez de quedar en blanco.
 */
export function useManualEntryOptions(clientId: string, savedEntries: CaseSupervisionManualEntry[] = []) {
  const { billingCodes } = useBillingCodes({ page: 0, pageSize: 0 })
  const { selectOptions: activityCategoryCatalogOptions } = useActivityCategoryCatalog()
  const { selectOptions: modalityCatalogOptions } = useModalityCatalog()
  const { items: participantCatalog } = useParticipantCatalog()
  const { addresses } = useClientAddresses(clientId || null)

  const billingCodeOptions = useMemo(
    () =>
      withSavedOptions(
        // El listado no siempre trae `active`: sólo se descartan los marcados inactivos
        billingCodes
          .filter((code) => code.active !== false)
          .map((code) => ({
            value: code.id,
            label: formatBillingCodeDisplay({ type: code.type, code: code.code, modifier: code.modifier }),
          })),
        savedEntries.map((e) => ({ value: e.billingCodeId, label: e.billingCode })),
      ),
    [billingCodes, savedEntries],
  )

  const locationOptions = useMemo(
    () =>
      withSavedOptions(
        addresses.map((address) => {
          return {
            value: address.id,
            label: formatPlaceServiceLabel(address.placeServiceName, address.placeServiceCode, address.addressLine1),
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

  /** Código por id para derivar el Service Type; cae al snapshot si ya no está activo */
  const billingCodeTextById = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of savedEntries) if (e.billingCodeId) map.set(e.billingCodeId, e.billingCode)
    for (const code of billingCodes) map.set(code.id, code.code)
    return map
  }, [billingCodes, savedEntries])

  const getServiceType = useCallback(
    (billingCodeId: string) => getServiceTypeForBillingCode(billingCodeTextById.get(billingCodeId)),
    [billingCodeTextById],
  )

  const toRow = useCallback(
    (entry: ManualEntryFormValue): ManualEntryRow => ({
      key: entry.key,
      date: entry.date,
      timeStart: entry.timeStart,
      timeEnd: entry.timeEnd,
      duration: getManualEntryDuration(entry.timeStart, entry.timeEnd),
      billingCode: labelOf(billingCodeOptions, entry.billingCodeId),
      serviceType: entry.serviceType,
      activityCategories: entry.activityCategoryIds
        .map((id) => labelOf(activityCategoryOptions, id))
        .filter(Boolean),
      participants: entry.participantIds
        .map((id) => labelOf(participantOptions, id))
        .filter(Boolean),
      location:
        savedEntries.find((savedEntry) => savedEntry.id === entry.id)?.clientAddressPlaceServiceName
        ?? labelOf(locationOptions, entry.clientAddressId),
      modality: labelOf(modalityOptions, entry.modalityCatalogId),
      description: entry.description,
    }),
    [activityCategoryOptions, billingCodeOptions, locationOptions, modalityOptions, participantOptions, savedEntries],
  )

  return {
    billingCodeOptions,
    locationOptions,
    modalityOptions,
    activityCategoryOptions,
    participantOptions,
    getServiceType,
    toRow,
  }
}
