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
import { Calendar, Clock, MapPin, Briefcase } from "lucide-react"
import type { Appointment } from "@/lib/types/appointment.types"
import { getMockClientById, getMockServiceById } from "@/lib/modules/schedules/mocks"
import { useAppointments } from "@/lib/store/appointments.store"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO, setHours, setMinutes, differenceInMinutes, addMinutes } from "date-fns"
import { cn } from "@/lib/utils"


interface DuplicateAppointmentModalProps {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
  rbtId: string
}


export function DuplicateAppointmentModal({
  open,
  onClose,
  appointment,
  rbtId,
}: DuplicateAppointmentModalProps) {
  const { toast } = useToast()
  const { addAppointment, checkConflict } = useAppointments()
  
  const [newDate, setNewDate] = useState("")
  const [keepSameTime, setKeepSameTime] = useState(true)
  const [newTime, setNewTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  if (!appointment) return null
  
  const client = getMockClientById(appointment.clientId)
  const service = getMockServiceById(appointment.serviceId)
  const originalStart = parseISO(appointment.startsAt)
  
  const handleDuplicate = () => {
    if (!newDate) {
      toast({
        title: "Date required",
        description: "Please select a date for the duplicated appointment",
        variant: "destructive",
      })
      return
    }
    
    const timeToUse = keepSameTime ? format(originalStart, "HH:mm") : newTime
    
    if (!timeToUse) {
      toast({
        title: "Time required",
        description: "Please enter a time for the appointment",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
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
        toast({
          title: "Schedule Conflict",
          description: "There's already an appointment at this time",
          variant: "destructive",
        })
        return
      }
      
      const duplicatedAppointment: Appointment = {
        ...appointment,
        id: `apt-${Date.now()}`,
        startsAt,
        endsAt,
        status: "Scheduled",
        createdAt: new Date().toISOString(),
      }
      
      addAppointment(duplicatedAppointment)
      
      toast({
        title: "Appointment Duplicated",
        description: "The appointment has been duplicated successfully",
      })
    
      setNewDate("")
      setKeepSameTime(true)
      setNewTime("")
      
      onClose()
    } finally {
      setIsSubmitting(false)
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
          <DialogTitle>Duplicate Appointment</DialogTitle>
        </VisuallyHidden>
        
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <h2 className="text-xl font-semibold text-gray-900">
            Duplicate Appointment
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a new date to duplicate this appointment
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-[#037ECC] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900">
                  {client?.fullName}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-[#037ECC] mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Service</p>
                <p className="text-sm font-medium text-gray-900">
                  {service?.name}
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
          
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">
              New Date <span className="text-[#037ECC]">*</span>
            </label>
            <input
              type="date"
              className={cn(
                "w-full h-11 px-4 rounded-xl",
                "border border-gray-200 bg-white",
                "text-sm text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
              )}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          
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
              loading={isSubmitting}
              className="h-10"
            >
              Duplicate Appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
