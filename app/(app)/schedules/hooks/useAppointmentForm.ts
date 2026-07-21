"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { Appointment, AppointmentFormData, EventType } from "@/lib/types/appointment.types"
import { useAppointments } from "@/lib/store/appointments.store"
import { useAppointmentMutations } from "@/lib/modules/schedules/hooks/use-appointment-mutations"
import { useApprovedBillingCodes } from "@/lib/modules/schedules/hooks/use-approved-billing-codes"
import { validateAppointmentEventData } from "@/lib/modules/schedules/services/appointment-validate.service"
import { usePriorAuthorizationLabel } from "@/lib/modules/schedules/hooks/use-prior-authorization-label"
import { useProvidersExcludingLoggedUser } from "@/lib/modules/providers/hooks/use-providers-excluding-logged-user"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import { getClientAddressById } from "@/lib/modules/client-addresses/services/client-addresses.service"
import { useAuth } from "@/lib/hooks/use-auth"
import { useUserById } from "@/lib/modules/users/hooks/use-user-by-id"
import { useAppointmentConfig } from "@/lib/modules/appointment-config/hooks/use-appointment-config"
import { useAlert } from "@/lib/contexts/alert-context"
import { canHaveInlineSupervision } from "@/lib/modules/schedules/utils/billing-code-supervision-rules"
import { useBillingCodes } from "@/lib/modules/billing-codes/hooks/use-billing-codes"
import {
  appointmentToFormData,
  buildAppointmentApiPayload,
  buildMainValidateKey,
  createEmptySupervisionForm,
  toApiEventType,
  toApiTime,
  toValidateTime,
} from "@/lib/modules/schedules/utils/appointment-api.mapper"
import {
  calculateBillableUnits,
  calculateDurationMinutes,
  getCurrentTime,
} from "@/lib/utils/unit-calculation"

/** Maps form eventType to the billingCodeType query param for the approved-billing-codes endpoint */
function eventTypeToBillingCodeType(eventType: EventType): string {
  switch (eventType) {
    case "session_note":
      return "Session"
    case "service_plan":
      return "Service Plan"
    case "supervision":
      return "Supervision"
  }
}

interface UseAppointmentFormProps {
  /** Whether the modal is open — used to reset form state on re-open */
  open?: boolean
  appointment?: Appointment | null
  /** Parent appointment for "Add New Session" flow */
  parentAppointment?: Appointment | null
  defaultDate?: string
  defaultTime?: string
  rbtId: string
  scope?: "provider" | "agency"
  onSuccess?: () => void
}

const getInitialFormData = (defaultDate?: string, defaultTime?: string): AppointmentFormData => ({
  eventType: "session_note",
  clientId: "",
  placeOfServiceAddressId: "",
  date: defaultDate || "",
  startTime: defaultTime || getCurrentTime(),
  endTime: "",
  billingCodeId: "",
  priorAuthorizationId: "",
  approvedPriorAuthorizationBillingCodeId: "",
  validatedUnits: null,
  addSupervision: false,
  supervision: createEmptySupervisionForm(),
})

export function useAppointmentForm({
  open,
  appointment,
  parentAppointment,
  defaultDate,
  defaultTime,
  rbtId,
  scope = "provider",
  onSuccess,
}: UseAppointmentFormProps) {
  const alert = useAlert()
  const { user } = useAuth()
  const { checkConflict } = useAppointments()
  const mutations = useAppointmentMutations()

  const [formData, setFormData] = useState<AppointmentFormData>(
    getInitialFormData(defaultDate, defaultTime),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidatingMain, setIsValidatingMain] = useState(false)
  const skipDependentResetsRef = useRef(0)
  const mainValidateKey = useRef("")

  const isEditing = !!appointment
  const isNewSessionMode = !!parentAppointment && !appointment
  const providerId = user?.id ?? rbtId

  // JWT role comes as "Unknown" — fetch full user to get actual role.name
  const { user: fullUser } = useUserById(user?.id || null)
  const roleName = fullUser?.role?.name ?? ""
  const normalizedRole = roleName.replace(/[\s_-]/g, "").toLowerCase()
  const isRbt = normalizedRole.includes("rbt")
  const isAdmin = /admin|superadmin/i.test(roleName)

  // ─── Assign to another provider (admin only) ───
  const [assignToOther, setAssignToOther] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState("")

  const { config: appointmentConfig } = useAppointmentConfig()
  const canAddSupervision = !isRbt && appointmentConfig?.allowedSubEvents === "supervision"

  const {
    clients,
    isLoading: clientsLoading,
    error: clientsError,
  } = useClientsByLoggedUser({ page: 0, pageSize: 100 })

  const {
    providers: clientProviders,
    isLoading: clientProvidersLoading,
  } = useProvidersExcludingLoggedUser(formData.clientId || null)

  const { addresses, isLoading: addressesLoading } = useClientAddresses(
    formData.clientId || null,
  )

  const billingCodeType = eventTypeToBillingCodeType(formData.eventType)
  const {
    billingCodes: mainBillingCodes,
    priorAuthorization: activePriorAuth,
    hasPriorAuthWithoutCodes,
    isLoading: mainBillingCodesLoading,
    error: mainBillingCodesError,
  } = useApprovedBillingCodes(formData.clientId || null, billingCodeType)

  // ─── Determine if selected BC allows inline supervision ───
  const selectedBillingCodeLabel = useMemo(() => {
    const bc = mainBillingCodes.find((b) => b.id === formData.billingCodeId)
    return bc?.label ?? ""
  }, [mainBillingCodes, formData.billingCodeId])

  const showSupervisionSwitch = canAddSupervision && canHaveInlineSupervision(selectedBillingCodeLabel)

  // Supervision billing codes — from catalog, NOT from PA (XP codes don't have authorized units)
  const {
    billingCodes: supervisionBillingCodesRaw,
    isLoading: supervisionBillingCodesLoading,
  } = useBillingCodes({ page: 0, pageSize: 0, filters: ["type__EQ__Supervision__AND"] })

  const supervisionCodeOptions = useMemo(
    () =>
      supervisionBillingCodesRaw.map((bc) => ({
        value: bc.id,
        label: [bc.type, bc.code, bc.modifier ? `(${bc.modifier})` : ""]
          .filter(Boolean)
          .join(" "),
      })),
    [supervisionBillingCodesRaw],
  )

  // ─── RBT provider options ───
  const rbtOptions = useMemo(
    () =>
      clientProviders
        .filter((provider) => provider.active && !provider.terminated && provider.userId)
        .map((provider) => ({
          value: provider.userId,
          label: provider.fullName,
        })),
    [clientProviders],
  )

  // ─── Effective provider (assign-to-other override) ───
  const effectiveProviderId = (isAdmin && assignToOther && selectedProviderId)
    ? selectedProviderId
    : providerId

  const durationMinutes = useMemo(
    () => calculateDurationMinutes(formData.startTime, formData.endTime),
    [formData.startTime, formData.endTime],
  )

  const billableUnits =
    formData.validatedUnits ?? calculateBillableUnits(durationMinutes)

  const { label: priorAuthorizationLabel, isLoading: isLoadingPriorAuthLabel } =
    usePriorAuthorizationLabel(formData.priorAuthorizationId, formData.clientId)

  const priorAuthorizationOptions = useMemo(() => {
    if (!formData.priorAuthorizationId) return []
    const activeLabel = activePriorAuth?.authNumber
      ? `PA # ${activePriorAuth.authNumber}`
      : ""
    const fallbackLabel = appointment?.priorAuthorizationNumber
      ? `PA # ${appointment.priorAuthorizationNumber}`
      : ""
    return [
      {
        value: formData.priorAuthorizationId,
        label: isLoadingPriorAuthLabel
          ? "Loading prior authorization…"
          : priorAuthorizationLabel || activeLabel || fallbackLabel || "Prior authorization",
      },
    ]
  }, [
    formData.priorAuthorizationId,
    priorAuthorizationLabel,
    isLoadingPriorAuthLabel,
    activePriorAuth?.authNumber,
    appointment?.priorAuthorizationNumber,
  ])

  const addressOptions = useMemo(() => {
    const options = addresses.map((addr) => ({
      value: addr.id,
      label: [addr.nickName, addr.placeService || addr.placeServiceName]
        .filter(Boolean)
        .join(" — "),
    }))

    const selectedId = formData.placeOfServiceAddressId
    if (selectedId && !options.some((option) => option.value === selectedId)) {
      options.unshift({
        value: selectedId,
        label: appointment?.addressLabel || "Selected address",
      })
    }

    return options
  }, [addresses, formData.placeOfServiceAddressId, appointment?.addressLabel])

  const billingCodeOptions = useMemo(() => {
    const options = mainBillingCodes.map((bc) => ({ value: bc.id, label: bc.label }))
    // In "Add New Session" mode, only show 97155 codes
    if (isNewSessionMode) {
      return options.filter((opt) => /\b97155\b/.test(opt.label))
    }
    return options
  }, [mainBillingCodes, isNewSessionMode])

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  const updateField = useCallback(
    <K extends keyof AppointmentFormData>(field: K, value: AppointmentFormData[K]) => {
      setFormData((prev) => {
        // Skip no-op updates to avoid resetting derived state
        if (prev[field] === value) return prev

        const next = { ...prev, [field]: value }
        if (field === "clientId") {
          next.placeOfServiceAddressId = ""
          next.billingCodeId = ""
          next.priorAuthorizationId = ""
          next.approvedPriorAuthorizationBillingCodeId = ""
          next.validatedUnits = null
          next.addSupervision = false
          next.supervision = createEmptySupervisionForm()
          setSelectedProviderId("")
        }
        if (
          field === "startTime" ||
          field === "endTime" ||
          field === "date" ||
          field === "billingCodeId"
        ) {
          next.priorAuthorizationId = ""
          next.approvedPriorAuthorizationBillingCodeId = ""
          next.validatedUnits = null
        }
        // Reset supervision when billing code changes
        if (field === "billingCodeId") {
          next.addSupervision = false
          next.supervision = createEmptySupervisionForm()
        }
        return next
      })
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as string]
        if (field === "startTime" || field === "endTime" || field === "date") {
          delete next.timeRange
        }
        return next
      })
      if (field === "startTime" || field === "endTime" || field === "date" || field === "billingCodeId") {
        setValidationError(null)
        mainValidateKey.current = ""
      }
      if (field === "clientId") {
        setValidationError(null)
        mainValidateKey.current = ""
      }
    },
    [],
  )

  const updateSupervisionField = useCallback(
    <K extends keyof AppointmentFormData["supervision"]>(
      field: K,
      value: AppointmentFormData["supervision"][K],
    ) => {
      setFormData((prev) => ({
        ...prev,
        supervision: { ...prev.supervision, [field]: value },
      }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[`supervision.${field}`]
        delete next.supervisionBillingCodeId
        delete next.supervisionRbtId
        if (field === "startTime" || field === "endTime" || field === "date") {
          delete next.supervisionTimeRange
        }
        return next
      })
    },
    [],
  )

  const isSupervisionConfigured = useMemo(() => {
    const s = formData.supervision
    return !!(s.providerId && s.billingCodeId && s.date && s.startTime && s.endTime)
  }, [formData.supervision])

  // ─── Effects ───

  useEffect(() => {
    if (appointment) {
      const data = appointmentToFormData(appointment)
      skipDependentResetsRef.current = 2
      setFormData(data)
      if (data.validatedUnits != null) {
        mainValidateKey.current = buildMainValidateKey(data)
      } else {
        mainValidateKey.current = ""
      }
      // If appointment provider differs from logged-in user, activate assign-to-other
      if (isAdmin && appointment.rbtId && appointment.rbtId !== providerId) {
        setAssignToOther(true)
        setSelectedProviderId(appointment.rbtId)
      } else {
        setAssignToOther(false)
        setSelectedProviderId("")
      }
    } else if (parentAppointment) {
      // "Add New Session" — pre-fill client/address from parent, use current time
      skipDependentResetsRef.current = 2
      setFormData({
        ...getInitialFormData(),
        eventType: "session_note",
        clientId: parentAppointment.clientId ?? "",
        placeOfServiceAddressId: parentAppointment.placeOfServiceAddressId ?? parentAppointment.clientAddressId ?? "",
        date: parentAppointment.date ?? "",
        startTime: getCurrentTime(),
        endTime: "",
      })
      mainValidateKey.current = ""
    } else {
      setFormData(getInitialFormData(defaultDate, defaultTime))
      mainValidateKey.current = ""
      setAssignToOther(false)
      setSelectedProviderId("")
    }
    setErrors({})
    setValidationError(null)
  }, [open, appointment, parentAppointment, defaultDate, defaultTime])

  useEffect(() => {
    if (isEditing) return
    if (!formData.clientId && clients.length === 1) {
      setFormData((prev) => ({ ...prev, clientId: clients[0].id }))
    }
  }, [clients, formData.clientId, isEditing])

  useEffect(() => {
    if (skipDependentResetsRef.current > 0) {
      skipDependentResetsRef.current--
      return
    }
    if (isEditing) return

    setFormData((prev) => ({
      ...prev,
      placeOfServiceAddressId: "",
      billingCodeId: "",
      priorAuthorizationId: "",
      approvedPriorAuthorizationBillingCodeId: "",
      validatedUnits: null,
    }))
    setValidationError(null)
    mainValidateKey.current = ""
  }, [formData.clientId, isEditing])

  useEffect(() => {
    if (!isEditing || formData.clientId || !formData.placeOfServiceAddressId) return

    let cancelled = false
    void getClientAddressById(formData.placeOfServiceAddressId)
      .then((address) => {
        if (cancelled || !address?.clientId) return
        skipDependentResetsRef.current = 1
        setFormData((prev) => ({ ...prev, clientId: address.clientId }))
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [isEditing, formData.clientId, formData.placeOfServiceAddressId])

  useEffect(() => {
    if (!addressesLoading && addresses.length === 1 && !formData.placeOfServiceAddressId) {
      setFormData((prev) => ({ ...prev, placeOfServiceAddressId: addresses[0].id }))
    }
  }, [addresses, addressesLoading, formData.placeOfServiceAddressId])

  useEffect(() => {
    if (!activePriorAuth || mainBillingCodes.length === 0) {
      setFormData((prev) => {
        if (!prev.priorAuthorizationId) return prev
        return { ...prev, priorAuthorizationId: "", approvedPriorAuthorizationBillingCodeId: "" }
      })
      return
    }
    setFormData((prev) => ({
      ...prev,
      priorAuthorizationId: activePriorAuth.id,
    }))
  }, [activePriorAuth, mainBillingCodes.length])

  useEffect(() => {
    if (mainBillingCodesLoading) return
    if (billingCodeOptions.length === 1 && !formData.billingCodeId) {
      setFormData((prev) => ({ ...prev, billingCodeId: billingCodeOptions[0].value }))
    }
  }, [billingCodeOptions, mainBillingCodesLoading, formData.billingCodeId])

  // Reset billing code on event type change
  useEffect(() => {
    if (skipDependentResetsRef.current > 0) {
      skipDependentResetsRef.current--
      return
    }
    if (isEditing) return

    setFormData((prev) => ({
      ...prev,
      billingCodeId: "",
      priorAuthorizationId: "",
      approvedPriorAuthorizationBillingCodeId: "",
      validatedUnits: null,
      addSupervision: false,
      supervision: createEmptySupervisionForm(),
    }))
    setValidationError(null)
    mainValidateKey.current = ""
  }, [formData.eventType, isEditing])

  // Auto-populate supervision date/times from main when toggled on
  useEffect(() => {
    if (!formData.addSupervision) {
      setFormData((prev) => ({ ...prev, supervision: createEmptySupervisionForm() }))
        return
    }
    setFormData((prev) => ({
      ...prev,
      supervision: {
        ...prev.supervision,
        date: prev.supervision.date || prev.date,
        startTime: prev.supervision.startTime || prev.startTime,
        endTime: prev.supervision.endTime || prev.endTime,
      },
    }))
  }, [formData.addSupervision])

  // Auto-select single supervision billing code
  useEffect(() => {
    if (supervisionBillingCodesLoading || !formData.addSupervision) return
    if (supervisionCodeOptions.length === 1 && !formData.supervision.billingCodeId) {
      setFormData((prev) => ({
        ...prev,
        supervision: { ...prev.supervision, billingCodeId: supervisionCodeOptions[0].value },
      }))
    }
  }, [supervisionCodeOptions, supervisionBillingCodesLoading, formData.addSupervision, formData.supervision.billingCodeId])

  // Auto-select single RBT provider for supervision
  useEffect(() => {
    if (clientProvidersLoading || !formData.addSupervision) return
    if (rbtOptions.length === 1 && !formData.supervision.providerId) {
      setFormData((prev) => ({
        ...prev,
        supervision: { ...prev.supervision, providerId: rbtOptions[0].value },
      }))
    }
  }, [rbtOptions, clientProvidersLoading, formData.addSupervision, formData.supervision.providerId])

  // Main validation effect
  useEffect(() => {
    const { clientId, billingCodeId, startTime, endTime, date, eventType } = formData
    if (!clientId || !billingCodeId || !startTime || !endTime || !date) return

    const key = buildMainValidateKey({ clientId, billingCodeId, startTime, endTime, date, eventType })
    if (key === mainValidateKey.current) return
    mainValidateKey.current = key

    let cancelled = false
    const run = async () => {
      try {
        setIsValidatingMain(true)
        setValidationError(null)
        const result = await validateAppointmentEventData({
          clientId,
          billingCodeId,
          startTime: toValidateTime(startTime),
          endTime: toValidateTime(endTime),
          date,
          appointmentTypeEvent: toApiEventType(eventType),
        })
        if (cancelled) return
        setFormData((prev) => ({
          ...prev,
          validatedUnits: result.unitsToUse,
          priorAuthorizationId: result.priorAuthorizationId,
          approvedPriorAuthorizationBillingCodeId: result.approvedPriorAuthorizationBillingCodeId,
        }))
      } catch (err) {
        if (cancelled) return
        mainValidateKey.current = ""
        setFormData((prev) => ({
          ...prev,
          validatedUnits: null,
          priorAuthorizationId: "",
          approvedPriorAuthorizationBillingCodeId: "",
        }))
        setValidationError(err instanceof Error ? err.message : "Validation failed")
      } finally {
        if (!cancelled) setIsValidatingMain(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [formData.clientId, formData.billingCodeId, formData.startTime, formData.endTime, formData.date, formData.eventType])

  // ─── Validation & Submit ───

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) newErrors.clientId = "Select a client"
    if (!formData.placeOfServiceAddressId) newErrors.placeOfServiceAddressId = "Select an address"
    if (!formData.date) newErrors.date = "Select a date"
    if (!formData.startTime) newErrors.startTime = "Select a start time"
    if (!formData.endTime) newErrors.endTime = "Select an end time"

    if (formData.startTime && formData.endTime) {
      const dur = calculateDurationMinutes(formData.startTime, formData.endTime)
      if (dur <= 0) newErrors.endTime = "End time must be after start time"
    }

    if (!formData.billingCodeId) {
      newErrors.billingCodeId = "Select a billing code"
    }

    // In "Add New Session" mode, prevent selecting the same billing code as the parent
    if (isNewSessionMode && parentAppointment?.billingCodeId && formData.billingCodeId === parentAppointment.billingCodeId) {
      newErrors.billingCodeId = "Cannot select the same billing code as the parent session"
    }

    if (validationError) {
      newErrors.timeRange = validationError
    }

    // Assign-to-other validation
    if (isAdmin && assignToOther && !selectedProviderId) {
      newErrors.assignedProviderId = "Select a provider"
    }

    // Supervision validation (only when switch is on and BC allows it)
    if (formData.addSupervision && showSupervisionSwitch) {
      if (!formData.supervision.providerId) newErrors.supervisionRbtId = "Select a provider"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validationError, showSupervisionSwitch, isNewSessionMode, parentAppointment])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) return

      const startsAt = new Date(`${formData.date}T${formData.startTime}`).toISOString()
      const endsAt = new Date(`${formData.date}T${formData.endTime}`).toISOString()

      if (scope === "provider" && isRbt) {
        const hasConflict = checkConflict(effectiveProviderId, startsAt, endsAt, appointment?.id)
        if (hasConflict) {
          alert.error("Schedule Conflict", "This time slot conflicts with another appointment")
          return
        }
      }

      const units = formData.validatedUnits ?? calculateBillableUnits(durationMinutes)
      const parentId = parentAppointment?.id ?? null
      const apiPayload = buildAppointmentApiPayload(formData, effectiveProviderId, units, parentId)

      // Attach supervision to the same request (backend handles it transactionally)
      if (formData.addSupervision && showSupervisionSwitch && formData.supervision.providerId) {
        apiPayload.supervision = {
          ...(isEditing && appointment?.supervision?.id
            ? { id: appointment.supervision.id }
            : {}),
          timeInit: toApiTime(formData.startTime),
          timeEnd: toApiTime(formData.endTime),
          date: formData.date,
          billingCodeId: formData.supervision.billingCodeId,
          supervisionBillingCodeId: formData.supervision.billingCodeId,
          units,
          providerId: formData.supervision.providerId,
        }
      }

      let appointmentId: string | null = null

      if (isEditing && appointment) {
        appointmentId = await mutations.update({ ...apiPayload, id: appointment.id })
      } else {
        appointmentId = await mutations.create(apiPayload)
      }

      if (!appointmentId) return

      onSuccess?.()
    },
    [
      validateForm,
      formData,
      effectiveProviderId,
      appointment,
      isEditing,
      durationMinutes,
      checkConflict,
      mutations,
      alert,
      onSuccess,
      showSupervisionSwitch,
    ],
  )

  const handleDelete = useCallback(async () => {
    if (!appointment) return
    if (!confirm("Are you sure you want to delete this appointment?")) return

    const success = await mutations.remove(appointment.id)
    if (success) onSuccess?.()
  }, [appointment, mutations, onSuccess])

  // True when all fields for validation are filled but priorAuthorizationId hasn't been resolved yet
  const pendingValidation =
    !!formData.clientId &&
    !!formData.billingCodeId &&
    !!formData.startTime &&
    !!formData.endTime &&
    !!formData.date &&
    !formData.priorAuthorizationId &&
    !validationError

  return {
    formData,
    updateField,
    updateSupervisionField,
    errors,
    validationError,
    isValidatingMain,
    pendingValidation,
    clientOptions,
    clientsLoading,
    clientsError,
    addressOptions,
    addressesLoading,
    billingCodeOptions,
    mainBillingCodesLoading,
    mainBillingCodesError,
    priorAuthorizationOptions,
    isLoadingPriorAuthLabel,
    activePriorAuth,
    hasActivePriorAuth: activePriorAuth !== null,
    hasPriorAuthWithoutCodes,
    durationMinutes,
    billableUnits,
    supervisionCodeOptions,
    supervisionBillingCodesLoading,
    rbtOptions,
    rbtProvidersLoading: clientProvidersLoading,
    showSupervisionSwitch,
    isNewSessionMode,
    isRbt,
    isAdmin,
    isEditing,
    assignToOther,
    setAssignToOther,
    selectedProviderId,
    setSelectedProviderId,
    providerOptions: rbtOptions,
    providerOptionsLoading: clientProvidersLoading,
    handleSubmit,
    handleDelete,
    isSubmitting: mutations.isLoading,
  }
}
