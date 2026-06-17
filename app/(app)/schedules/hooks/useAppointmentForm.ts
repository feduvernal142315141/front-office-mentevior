"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { format, parseISO } from "date-fns"
import type {
  Appointment,
  AppointmentFormData,
  EventType,
  ScheduleBillingCode,
} from "@/lib/types/appointment.types"
import { useAppointments } from "@/lib/store/appointments.store"
// TODO: Connect when backend is ready
// import { useAppointmentMutations } from "@/lib/modules/schedules/hooks/use-appointment-mutations"
import {
  getMockClients,
  getMockBillingCodesByEventType,
  getMockSupervisionBillingCodes,
  getMockRBTs,
} from "@/lib/modules/schedules/mocks"
import { useClientAddresses } from "@/lib/modules/client-addresses/hooks/use-client-addresses"
import { useAuth } from "@/lib/hooks/use-auth"
import { useAlert } from "@/lib/contexts/alert-context"
import {
  calculateBillableUnits,
  calculateDurationMinutes,
  roundToNearest15Minutes,
} from "@/lib/utils/unit-calculation"

// ============================================
// Types
// ============================================

interface UseAppointmentFormProps {
  appointment?: Appointment | null
  defaultDate?: string
  defaultTime?: string
  rbtId: string
  onSuccess?: () => void
}

// ============================================
// Initial form state
// ============================================

const getInitialFormData = (defaultDate?: string, defaultTime?: string): AppointmentFormData => ({
  eventType: "session_note",
  clientId: "",
  placeOfServiceAddressId: "",
  date: defaultDate || "",
  startTime: defaultTime || roundToNearest15Minutes(),
  endTime: "",
  billingCodeIds: [],
  addSupervision: false,
  supervisionRbtId: "",
  supervisionBillingCodeIds: [],
  requiresCaregiverSignature: false,
  notes: "",
})

// ============================================
// Hook
// ============================================

export function useAppointmentForm({
  appointment,
  defaultDate,
  defaultTime,
  rbtId,
  onSuccess,
}: UseAppointmentFormProps) {
  const alert = useAlert()
  const { user } = useAuth()
  const { addAppointment, updateAppointment, deleteAppointment, checkConflict } = useAppointments()

  const [formData, setFormData] = useState<AppointmentFormData>(
    getInitialFormData(defaultDate, defaultTime)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!appointment

  // Role check — supervision section only for non-RBT
  const userRole = (user as any)?.role || (user as any)?.roleName || ""
  const normalizedRole = typeof userRole === "string"
    ? userRole.replace(/[\s_-]/g, "").toLowerCase()
    : typeof userRole === "object" && userRole?.name
      ? (userRole.name as string).replace(/[\s_-]/g, "").toLowerCase()
      : ""
  const isRbt = normalizedRole.includes("rbt")

  // ── Data Sources ──────────────────────────────────────────

  // Clients assigned to this provider (mock for now)
  const clients = useMemo(() => getMockClients().filter((c) => c.active), [])

  // Client addresses (real hook)
  const { addresses, isLoading: addressesLoading } = useClientAddresses(
    formData.clientId || null
  )

  // Billing codes by event type (mock)
  const availableBillingCodes = useMemo(
    () => getMockBillingCodesByEventType(formData.eventType),
    [formData.eventType]
  )

  // Supervision billing codes (mock)
  const supervisionBillingCodes = useMemo(() => getMockSupervisionBillingCodes(), [])

  // RBTs list for supervision selector (mock)
  const rbts = useMemo(() => getMockRBTs(), [])

  // ── Computed Values ───────────────────────────────────────

  const durationMinutes = useMemo(
    () => calculateDurationMinutes(formData.startTime, formData.endTime),
    [formData.startTime, formData.endTime]
  )

  const billableUnits = useMemo(
    () => calculateBillableUnits(durationMinutes),
    [durationMinutes]
  )

  // ── Address options for Place of Service ──────────────────

  const addressOptions = useMemo(
    () =>
      addresses.map((addr) => ({
        value: addr.id,
        label: [addr.nickName, addr.placeService || addr.placeServiceName]
          .filter(Boolean)
          .join(" — "),
      })),
    [addresses]
  )

  // ── Billing code options ──────────────────────────────────

  const billingCodeOptions = useMemo(
    () =>
      availableBillingCodes.map((bc) => ({
        value: bc.id,
        label: bc.label,
      })),
    [availableBillingCodes]
  )

  const supervisionCodeOptions = useMemo(
    () =>
      supervisionBillingCodes.map((bc) => ({
        value: bc.id,
        label: bc.label,
      })),
    [supervisionBillingCodes]
  )

  // Client options for FloatingSelect
  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: c.fullName,
      })),
    [clients]
  )

  // RBT options for supervision
  const rbtOptions = useMemo(
    () =>
      rbts.map((r) => ({
        value: r.id,
        label: r.fullName,
      })),
    [rbts]
  )

  // ── Field Updater ─────────────────────────────────────────

  const updateField = useCallback(
    <K extends keyof AppointmentFormData>(field: K, value: AppointmentFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    []
  )

  // ── Cascading Effects ─────────────────────────────────────

  // Reset form when modal opens/closes or appointment changes
  useEffect(() => {
    if (appointment) {
      const startTime = parseISO(appointment.startsAt)
      const endTime = parseISO(appointment.endsAt)
      setFormData({
        eventType: appointment.eventType || "session_note",
        clientId: appointment.clientId,
        placeOfServiceAddressId: appointment.placeOfServiceAddressId || "",
        date: format(startTime, "yyyy-MM-dd"),
        startTime: format(startTime, "HH:mm"),
        endTime: format(endTime, "HH:mm"),
        billingCodeIds: appointment.billingCodeIds || [],
        addSupervision: appointment.addSupervision || false,
        supervisionRbtId: appointment.supervisionRbtId || "",
        supervisionBillingCodeIds: appointment.supervisionBillingCodeIds || [],
        requiresCaregiverSignature: appointment.requiresCaregiverSignature || false,
        notes: appointment.notes || "",
      })
    } else {
      setFormData(getInitialFormData(defaultDate, defaultTime))
    }
    setErrors({})
  }, [appointment, defaultDate, defaultTime])

  // Auto-select client if only one
  useEffect(() => {
    if (!formData.clientId && clients.length === 1) {
      setFormData((prev) => ({ ...prev, clientId: clients[0].id }))
    }
  }, [clients, formData.clientId])

  // When clientId changes → clear dependent fields
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      placeOfServiceAddressId: "",
      billingCodeIds: [],
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.clientId])

  // Auto-select address if only one
  useEffect(() => {
    if (!addressesLoading && addresses.length === 1 && !formData.placeOfServiceAddressId) {
      setFormData((prev) => ({ ...prev, placeOfServiceAddressId: addresses[0].id }))
    }
  }, [addresses, addressesLoading, formData.placeOfServiceAddressId])

  // When eventType changes → clear billing codes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, billingCodeIds: [] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.eventType])

  // When supervision toggled off → clear supervision fields
  useEffect(() => {
    if (!formData.addSupervision) {
      setFormData((prev) => ({
        ...prev,
        supervisionRbtId: "",
        supervisionBillingCodeIds: [],
      }))
    }
  }, [formData.addSupervision])

  // ── Validation ────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) newErrors.clientId = "Select a client"
    if (!formData.placeOfServiceAddressId) newErrors.placeOfServiceAddressId = "Select a place of service"
    if (!formData.date) newErrors.date = "Select a date"
    if (!formData.startTime) newErrors.startTime = "Select a start time"
    if (!formData.endTime) newErrors.endTime = "Select an end time"

    if (formData.startTime && formData.endTime) {
      const dur = calculateDurationMinutes(formData.startTime, formData.endTime)
      if (dur <= 0) newErrors.endTime = "End time must be after start time"
    }

    if (formData.billingCodeIds.length === 0) {
      newErrors.billingCodeIds = "Select at least one billing code"
    }

    if (formData.addSupervision) {
      if (!formData.supervisionRbtId) newErrors.supervisionRbtId = "Select an RBT"
      if (formData.supervisionBillingCodeIds.length === 0) {
        newErrors.supervisionBillingCodeIds = "Select supervision billing codes"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // ── Submit ────────────────────────────────────────────────

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        alert.error("Validation Error", "Please fill in all required fields")
        return
      }

      setIsSubmitting(true)

      try {
        const startsAt = new Date(`${formData.date}T${formData.startTime}`).toISOString()
        const endsAt = new Date(`${formData.date}T${formData.endTime}`).toISOString()

        const hasConflict = checkConflict(rbtId, startsAt, endsAt, appointment?.id)
        if (hasConflict) {
          alert.error("Schedule Conflict", "This time slot conflicts with another appointment")
          return
        }

        // Resolve location from address for backward compat with calendar cards
        const addr = addresses.find((a) => a.id === formData.placeOfServiceAddressId)
        const placeName = (addr?.placeService || addr?.nickName || "").toLowerCase()
        const locationLabel = (
          placeName.includes("home") ? "Home"
          : placeName.includes("school") ? "School"
          : placeName.includes("tele") ? "Telehealth"
          : "Clinic"
        ) as "Clinic" | "Home" | "School" | "Telehealth"

        const payload = {
          clientId: formData.clientId,
          serviceId: "",
          location: locationLabel,
          startsAt,
          endsAt,
          notes: formData.notes,
          eventType: formData.eventType,
          placeOfServiceAddressId: formData.placeOfServiceAddressId,
          billingCodeIds: formData.billingCodeIds,
          addSupervision: formData.addSupervision,
          supervisionRbtId: formData.supervisionRbtId || undefined,
          supervisionBillingCodeIds: formData.supervisionBillingCodeIds.length > 0
            ? formData.supervisionBillingCodeIds
            : undefined,
          requiresCaregiverSignature: formData.requiresCaregiverSignature,
        }

        if (isEditing && appointment) {
          updateAppointment(appointment.id, payload)
          alert.success("Appointment Updated", "The appointment has been updated successfully")
        } else {
          addAppointment({
            id: `apt-${Date.now()}`,
            rbtId,
            status: "Scheduled",
            createdAt: new Date().toISOString(),
            ...payload,
          })
          alert.success("Appointment Created", "New appointment has been scheduled")
        }

        onSuccess?.()
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      validateForm, formData, rbtId, appointment, isEditing,
      addresses, checkConflict, updateAppointment, addAppointment, alert, onSuccess,
    ]
  )

  // ── Delete ────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    if (!appointment) return
    if (confirm("Are you sure you want to delete this appointment?")) {
      deleteAppointment(appointment.id)
      alert.success("Appointment Deleted", "The appointment has been removed")
      onSuccess?.()
    }
  }, [appointment, deleteAppointment, alert, onSuccess])

  // ── Return ────────────────────────────────────────────────

  return {
    formData,
    updateField,
    errors,

    // Data for selectors
    clientOptions,
    addressOptions,
    addressesLoading,
    billingCodeOptions,
    supervisionCodeOptions,
    rbtOptions,

    // Computed
    durationMinutes,
    billableUnits,

    // Role
    isRbt,
    isEditing,

    // Actions
    handleSubmit,
    handleDelete,
    isSubmitting,
  }
}
