"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/custom/Button"
import { PremiumDatePicker } from "@/components/custom/PremiumDatePicker"
import { Calendar, Clock, MapPin, Briefcase } from "lucide-react"
import type { Appointment, AppointmentApiPayload } from "@/lib/types/appointment.types"
import { getEventTypeLabel, toApiEventType, toApiTime } from "@/lib/modules/schedules/utils/appointment-api.mapper"
import { useAppointmentMutations } from "@/lib/modules/schedules/hooks/use-appointment-mutations"
import { useAppointments } from "@/lib/store/appointments.store"
import { useAlert } from "@/lib/contexts/alert-context"
import { format, parseISO, setHours, setMinutes, differenceInMinutes, addMinutes } from "date-fns"
import { cn } from "@/lib/utils"


interface DuplicateAppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
  rbtId: string
  onDuplicated?: () => void
}


export function DuplicateAppointmentModal({
  open,
  onClose,
  appointment,
  rbtId,
  onDuplicated,
}: DuplicateAppointmentModalProps) {
  const alert = useAlert()
  const mutations = useAppointmentMutations()
  const { checkConflict } = useAppointments()

  const [newDate, setNewDate] = useState("")
  const [keepSameTime, setKeepSameTime] = useState(true)
  const [newTime, setNewTime] = useState("")
  const [dateError, setDateError] = useState("")

  if (!appointment) return null

  const eventLabel =
    appointment.billingCodeName ?? getEventTypeLabel(appointment.eventType)
  const originalStart = parseISO(appointment.startsAt)

  const handleDuplicate = async () => {
    setDateError("")

    if (!newDate) {
      setDateError("Please select a date")
      return
    }

    const timeToUse = keepSameTime ? format(originalStart, "HH:mm") : newTime

    if (!timeToUse) {
      setDateError("Please enter a time for the session")
      return
    }

    const [hours, minutes] = timeToUse.split(":").map(Number)
    const duration = differenceInMinutes(
      parseISO(appointment.endsAt),
      originalStart
    )

    const startsAt = setMinutes(
      setHours(parseISO(newDate), hours),
      minutes
    ).toISOString()
    const endsAt = addMinutes(parseISO(startsAt), duration).toISOString()

    if (checkConflict(rbtId, startsAt, endsAt)) {
      alert.error("Schedule Conflict", "There's already a session at this time")
      return
    }

    const endTime = format(parseISO(endsAt), "HH:mm")

    const payload: AppointmentApiPayload = {
      clientId: appointment.clientId || "",
      clientAddressId: appointment.placeOfServiceAddressId || appointment.clientAddressId || "",
      cantUnit: appointment.cantUnit ?? appointment.units ?? 0,
      units: appointment.units ?? appointment.cantUnit ?? 0,
      timeInit: toApiTime(timeToUse),
      timeEnd: toApiTime(endTime),
      date: newDate,
      billingCodeId: appointment.billingCodeId || "",
      typeEvent: toApiEventType(appointment.eventType ?? "session_note"),
      providerId: appointment.rbtId || rbtId,
      priorAuthorizationId: appointment.priorAuthorizationId || "",
    }

    if (appointment.supervision) {
      payload.supervision = { ...appointment.supervision, date: newDate }
    }

    const createdId = await mutations.create(payload)

    if (createdId) {
      setNewDate("")
      setKeepSameTime(true)
      setNewTime("")
      onDuplicated?.()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-[480px] p-0 gap-0",
          "bg-white rounded-2xl overflow-hidden",
          "border border-gray-100",
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
        )}
        showCloseButton={true}
      >
        <VisuallyHidden>
          <DialogTitle>Duplicate Session</DialogTitle>
        </VisuallyHidden>

        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <h2 className="text-xl font-semibold text-gray-900">
            Duplicate Session
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a new date to duplicate this session
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-[#037ECC] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.clientName ?? "Unknown Client"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-[#037ECC] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Service</p>
                <p className="text-sm font-medium text-gray-900">
                  {eventLabel}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-[#037ECC] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Original Time</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(originalStart, "HH:mm")} - {format(parseISO(appointment.endsAt), "HH:mm")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[#037ECC] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.location}
                </p>
              </div>
            </div>
          </div>

          <PremiumDatePicker
            label="New Date"
            value={newDate}
            onChange={(v) => { setNewDate(v); setDateError("") }}
            onClear={() => setNewDate("")}
            hasError={!!dateError}
            errorMessage={dateError}
            required
          />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="keepSameTime"
                checked={keepSameTime}
                onCheckedChange={(checked) => setKeepSameTime(checked as boolean)}
              />
              <label
                htmlFor="keepSameTime"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Keep same time ({format(originalStart, "HH:mm")})
              </label>
            </div>

            {!keepSameTime && (
              <div className="ml-7">
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  New Time
                </label>
                <input
                  type="time"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl",
                    "border border-gray-200 bg-white",
                    "text-sm text-gray-900",
                    "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
                  )}
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDuplicate}
              loading={mutations.isLoading}
              className="h-10"
            >
              Duplicate Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
