"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { format, parseISO } from "date-fns"
import type { Appointment, AppointmentFormData } from "@/lib/types/appointment.types"
import { useAppointments } from "@/lib/store/appointments.store"
import { useAppointmentMutations } from "@/lib/modules/schedules/hooks/use-appointment-mutations"
import {
  useAppointmentBillingCodes,
  eventTypeToBillingContext,
} from "@/lib/modules/schedules/hooks/use-appointment-billing-codes"
import { validateAppointmentEventData } from "@/lib/modules/schedules/services/appointment-validate.service"
import { getMockRBTs } from "@/lib/modules/schedules/mocks"
import { useClients } from "@/lib/modules/clients/hooks/use-clients"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import { useAuth } from "@/lib/hooks/use-auth"
import { useAlert } from "@/lib/contexts/alert-context"
import {
  buildAppointmentApiPayload,
  createEmptySupervisionForm,
  fromApiEventType,
  toApiEventType,
  toValidateTime,
} from "@/lib/modules/schedules/utils/appointment-api.mapper"
import {
  calculateBillableUnits,
  calculateDurationMinutes,
  roundToNearest15Minutes,
} from "@/lib/utils/unit-calculation"

interface UseAppointmentFormProps {
  appointment?: Appointment | null
  defaultDate?: string
  defaultTime?: string
  rbtId: string
  onSuccess?: () => void
}

const getInitialFormData = (defaultDate?: string, defaultTime?: string): AppointmentFormData => ({
  eventType: "session_note",
  clientId: "",
  placeOfServiceAddressId: "",
  date: defaultDate || "",
  startTime: defaultTime || roundToNearest15Minutes(),
  endTime: "",
  billingCodeId: "",
  priorAuthorizationId: "",
  validatedUnits: null,
  addSupervision: false,
  supervision: createEmptySupervisionForm(),
})

export function useAppointmentForm({
  appointment,
  defaultDate,
  defaultTime,
  rbtId,
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
  const [supervisionValidationError, setSupervisionValidationError] = useState<string | null>(null)
  const [isValidatingMain, setIsValidatingMain] = useState(false)
  const [isValidatingSupervision, setIsValidatingSupervision] = useState(false)

  const isEditing = !!appointment
  const providerId = user?.id ?? rbtId

  const userRole = (user as { role?: { name?: string } | string })?.role
  const normalizedRole =
    typeof userRole === "string"
      ? userRole.replace(/[\s_-]/g, "").toLowerCase()
      : typeof userRole === "object" && userRole?.name
        ? userRole.name.replace(/[\s_-]/g, "").toLowerCase()
        : ""
  const isRbt = normalizedRole.includes("rbt")

  const {
    clients,
    isLoading: clientsLoading,
    error: clientsError,
  } = useClients({ page: 0, pageSize: 100 })

  const rbts = useMemo(() => getMockRBTs(), [])

  const { addresses, isLoading: addressesLoading } = useClientAddresses(
    formData.clientId || null,
  )

  const billingContext = eventTypeToBillingContext(formData.eventType)
  const {
    billingCodes: mainBillingCodes,
    isLoading: mainBillingCodesLoading,
    error: mainBillingCodesError,
  } = useAppointmentBillingCodes({ context: billingContext })

  const {
    billingCodes: supervisionBillingCodes,
    isLoading: supervisionBillingCodesLoading,
  } = useAppointmentBillingCodes({
    context: "supervision",
    enabled: formData.addSupervision && formData.eventType === "service_plan",
  })

  const durationMinutes = useMemo(
    () => calculateDurationMinutes(formData.startTime, formData.endTime),
    [formData.startTime, formData.endTime],
  )

  const billableUnits =
    formData.validatedUnits ?? calculateBillableUnits(durationMinutes)

  const supervisionDurationMinutes = useMemo(
    () =>
      calculateDurationMinutes(
        formData.supervision.startTime,
        formData.supervision.endTime,
      ),
    [formData.supervision.startTime, formData.supervision.endTime],
  )

  const supervisionBillableUnits =
    formData.supervision.validatedUnits ??
    calculateBillableUnits(supervisionDurationMinutes)

  const addressOptions = useMemo(
    () =>
      addresses.map((addr) => ({
        value: addr.id,
        label: [addr.nickName, addr.placeService || addr.placeServiceName]
          .filter(Boolean)
          .join(" — "),
      })),
    [addresses],
  )

  const billingCodeOptions = useMemo(
    () =>
      mainBillingCodes.map((bc) => ({
        value: bc.id,
        label: bc.name,
      })),
    [mainBillingCodes],
  )

  const supervisionCodeOptions = useMemo(
    () =>
      supervisionBillingCodes.map((bc) => ({
        value: bc.id,
        label: bc.name,
      })),
    [supervisionBillingCodes],
  )

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.fullName })),
    [clients],
  )

  const rbtOptions = useMemo(
    () => rbts.map((r) => ({ value: r.id, label: r.fullName })),
    [rbts],
  )

  const updateField = useCallback(
    <K extends keyof AppointmentFormData>(field: K, value: AppointmentFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as string]
        if (field === "startTime" || field === "endTime" || field === "date") {
          delete next.timeRange
        }
        return next
      })
      if (field === "startTime" || field === "endTime" || field === "date") {
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
        if (
          field === "startTime" ||
          field === "endTime" ||
          field === "date"
        ) {
          delete next.supervisionTimeRange
        }
        return next
      })
      if (field === "startTime" || field === "endTime" || field === "date") {
        setSupervisionValidationError(null)
        supervisionValidateKey.current = ""
      }
    },
    [],
  )

  const setSupervisionData = useCallback((supervision: AppointmentFormData["supervision"]) => {
    setFormData((prev) => ({ ...prev, supervision }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.supervisionRbtId
      delete next.supervisionBillingCodeId
      delete next["supervision.date"]
      delete next["supervision.startTime"]
      delete next["supervision.endTime"]
      delete next.supervisionTimeRange
      delete next.supervisionConfig
      return next
    })
    setSupervisionValidationError(null)
    supervisionValidateKey.current = ""
  }, [])

  const isSupervisionConfigured = useMemo(() => {
    const s = formData.supervision
    return !!(
      s.title.trim() &&
      s.providerId &&
      s.billingCodeId &&
      s.date &&
      s.startTime &&
      s.endTime
    )
  }, [formData.supervision])

  useEffect(() => {
    if (appointment) {
      const startTime = parseISO(appointment.startsAt)
      const endTime = parseISO(appointment.endsAt)
      const billingCodeId =
        appointment.billingCodeIds?.[0] ?? (appointment as { billingCodeId?: string }).billingCodeId ?? ""

      setFormData({
        eventType: appointment.eventType || fromApiEventType(),
        clientId: appointment.clientId,
        placeOfServiceAddressId: appointment.placeOfServiceAddressId || "",
        date: format(startTime, "yyyy-MM-dd"),
        startTime: format(startTime, "HH:mm"),
        endTime: format(endTime, "HH:mm"),
        billingCodeId,
        priorAuthorizationId: appointment.priorAuthorizationId || "",
        validatedUnits: appointment.units ?? null,
        addSupervision: appointment.addSupervision || false,
        supervision: {
          ...createEmptySupervisionForm(),
          providerId: appointment.supervisionRbtId || "",
          billingCodeId: appointment.supervisionBillingCodeIds?.[0] ?? "",
        },
      })
    } else {
      setFormData(getInitialFormData(defaultDate, defaultTime))
    }
    setErrors({})
    setValidationError(null)
    setSupervisionValidationError(null)
  }, [appointment, defaultDate, defaultTime])

  useEffect(() => {
    if (!formData.clientId && clients.length === 1) {
      setFormData((prev) => ({ ...prev, clientId: clients[0].id }))
    }
  }, [clients, formData.clientId])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      placeOfServiceAddressId: "",
      billingCodeId: "",
      priorAuthorizationId: "",
      validatedUnits: null,
    }))
    setValidationError(null)
  }, [formData.clientId])

  useEffect(() => {
    if (!addressesLoading && addresses.length === 1 && !formData.placeOfServiceAddressId) {
      setFormData((prev) => ({ ...prev, placeOfServiceAddressId: addresses[0].id }))
    }
  }, [addresses, addressesLoading, formData.placeOfServiceAddressId])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      billingCodeId: "",
      priorAuthorizationId: "",
      validatedUnits: null,
      ...(formData.eventType !== "service_plan"
        ? {
            addSupervision: false,
            supervision: createEmptySupervisionForm(),
          }
        : {}),
    }))
    setValidationError(null)
    setSupervisionValidationError(null)
  }, [formData.eventType])

  useEffect(() => {
    if (!formData.addSupervision) {
      setFormData((prev) => ({
        ...prev,
        supervision: createEmptySupervisionForm(),
      }))
      setSupervisionValidationError(null)
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

  const mainValidateKey = useRef("")
  useEffect(() => {
    const { clientId, billingCodeId, startTime, endTime, date, eventType } = formData
    if (!clientId || !billingCodeId || !startTime || !endTime || !date) {
      return
    }

    const key = `${clientId}|${billingCodeId}|${startTime}|${endTime}|${date}|${eventType}`
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
          appointmentTypeEvent: toApiEventType(eventType),
        })
        if (cancelled) return
        setFormData((prev) => ({
          ...prev,
          validatedUnits: result.unitsToUse,
          priorAuthorizationId: result.approvedPriorAuthorizationBillingCodeId,
        }))
      } catch (err) {
        if (cancelled) return
        mainValidateKey.current = ""
        setFormData((prev) => ({
          ...prev,
          validatedUnits: null,
          priorAuthorizationId: "",
        }))
        setValidationError(err instanceof Error ? err.message : "Validation failed")
      } finally {
        if (!cancelled) setIsValidatingMain(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    formData.clientId,
    formData.billingCodeId,
    formData.startTime,
    formData.endTime,
    formData.date,
    formData.eventType,
  ])

  const supervisionValidateKey = useRef("")
  useEffect(() => {
    if (!formData.addSupervision || formData.eventType !== "service_plan") return

    const { clientId } = formData
    const { billingCodeId, startTime, endTime, date } = formData.supervision
    if (!clientId || !billingCodeId || !startTime || !endTime || !date) return

    const key = `${clientId}|${billingCodeId}|${startTime}|${endTime}|${date}|supervision`
    if (key === supervisionValidateKey.current) return
    supervisionValidateKey.current = key

    let cancelled = false
    const run = async () => {
      try {
        setIsValidatingSupervision(true)
        setSupervisionValidationError(null)
        const result = await validateAppointmentEventData({
          clientId,
          billingCodeId,
          startTime: toValidateTime(startTime),
          endTime: toValidateTime(endTime),
          appointmentTypeEvent: "Supervision",
        })
        if (cancelled) return
        setFormData((prev) => ({
          ...prev,
          supervision: {
            ...prev.supervision,
            validatedUnits: result.unitsToUse,
            priorAuthorizationId: result.approvedPriorAuthorizationBillingCodeId,
          },
        }))
      } catch (err) {
        if (cancelled) return
        supervisionValidateKey.current = ""
        setFormData((prev) => ({
          ...prev,
          supervision: {
            ...prev.supervision,
            validatedUnits: null,
            priorAuthorizationId: "",
          },
        }))
        setSupervisionValidationError(
          err instanceof Error ? err.message : "Supervision validation failed",
        )
      } finally {
        if (!cancelled) setIsValidatingSupervision(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    formData.addSupervision,
    formData.eventType,
    formData.clientId,
    formData.supervision.billingCodeId,
    formData.supervision.startTime,
    formData.supervision.endTime,
    formData.supervision.date,
  ])

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

    if (validationError) {
      newErrors.timeRange = validationError
    }

    if (formData.addSupervision) {
      if (!isSupervisionConfigured) {
        newErrors.supervisionConfig = "Configure supervision details"
      }
      if (!formData.supervision.title.trim()) newErrors.supervisionTitle = "Enter a supervision title"
      if (!formData.supervision.providerId) newErrors.supervisionRbtId = "Select an RBT"
      if (!formData.supervision.billingCodeId) {
        newErrors.supervisionBillingCodeId = "Select a supervision billing code"
      }
      if (!formData.supervision.date) newErrors["supervision.date"] = "Select a supervision date"
      if (!formData.supervision.startTime) {
        newErrors["supervision.startTime"] = "Select supervision start time"
      }
      if (!formData.supervision.endTime) {
        newErrors["supervision.endTime"] = "Select supervision end time"
      }
      if (supervisionValidationError) {
        newErrors.supervisionTimeRange = supervisionValidationError
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, validationError, supervisionValidationError, isSupervisionConfigured])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        alert.error("Validation Error", "Please fill in all required fields")
        return
      }

      const startsAt = new Date(`${formData.date}T${formData.startTime}`).toISOString()
      const endsAt = new Date(`${formData.date}T${formData.endTime}`).toISOString()

      const hasConflict = checkConflict(providerId, startsAt, endsAt, appointment?.id)
      if (hasConflict) {
        alert.error("Schedule Conflict", "This time slot conflicts with another appointment")
        return
      }

      const units = formData.validatedUnits ?? calculateBillableUnits(durationMinutes)
      const apiPayload = buildAppointmentApiPayload(formData, providerId, units)

      if (isEditing && appointment) {
        const id = await mutations.update({ ...apiPayload, id: appointment.id })
        if (id) onSuccess?.()
      } else {
        const id = await mutations.create(apiPayload)
        if (id) onSuccess?.()
      }
    },
    [
      validateForm,
      formData,
      providerId,
      appointment,
      isEditing,
      durationMinutes,
      checkConflict,
      mutations,
      alert,
      onSuccess,
    ],
  )

  const handleDelete = useCallback(async () => {
    if (!appointment) return
    if (!confirm("Are you sure you want to delete this appointment?")) return

    const success = await mutations.remove(appointment.id)
    if (success) onSuccess?.()
  }, [appointment, mutations, onSuccess])

  return {
    formData,
    updateField,
    updateSupervisionField,
    setSupervisionData,
    isSupervisionConfigured,
    errors,
    validationError,
    supervisionValidationError,
    isValidatingMain,
    isValidatingSupervision,
    clientOptions,
    clientsLoading,
    clientsError,
    addressOptions,
    addressesLoading,
    billingCodeOptions,
    mainBillingCodesLoading,
    mainBillingCodesError,
    supervisionCodeOptions,
    supervisionBillingCodesLoading,
    rbtOptions,
    durationMinutes,
    billableUnits,
    supervisionDurationMinutes,
    supervisionBillableUnits,
    isRbt,
    isEditing,
    handleSubmit,
    handleDelete,
    isSubmitting: mutations.isLoading,
  }
}
