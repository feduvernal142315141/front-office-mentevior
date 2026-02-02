"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Clock, GripVertical, MapPin } from "lucide-react"
import type { Appointment, AppointmentStatus } from "@/lib/types/appointment.types"
import { getMockClientById, getMockServiceById } from "@/lib/modules/schedules/mocks"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"


const LOCATION_ICONS: Record<Appointment["location"], string> = {
  Clinic: "🏥",
  Home: "🏠",
  School: "🏫",
  Telehealth: "💻",
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  InProgress: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  NoShow: "bg-gray-50 text-gray-700 border-gray-200",
}


interface AppointmentCardProps {
  appointment: Appointment
  onClick?: () => void
  onStatusChange?: (status: AppointmentStatus) => void
  isDragOverlay?: boolean
}


export function AppointmentCard({
  appointment,
  onClick,
  onStatusChange,
  isDragOverlay = false,
}: AppointmentCardProps) {
  const client = getMockClientById(appointment.clientId)
  const service = getMockServiceById(appointment.serviceId)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    "--service-color": service?.color ?? "#037ECC",
  } as React.CSSProperties
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(

        "group relative h-full w-full",
        "bg-white rounded-lg",
        "border-l-[3px] border border-gray-100",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "transition-all duration-200",
        "cursor-pointer overflow-hidden",
        
    
        "border-l-[var(--service-color)]",
        
  
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        "hover:border-gray-200",
        
  
        isDragging && "opacity-50 shadow-2xl scale-105 z-50",
        isDragOverlay && "shadow-2xl scale-105",
        
      
        appointment.status === "Cancelled" && "opacity-60",
      )}
      onClick={onClick}
    >
  
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-1 top-1",
          "opacity-0 group-hover:opacity-100",
          "cursor-grab active:cursor-grabbing",
          "transition-opacity duration-200",
          "p-1 rounded hover:bg-gray-100",
        )}
      >
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>
      
      <div className="p-2 pl-4 space-y-1">

        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs text-gray-900 truncate">
              {client?.fullName ?? "Unknown Client"}
            </p>
            <p className="text-[10px] text-gray-600 truncate">
              {service?.name ?? "Unknown Service"}
            </p>
          </div>
          
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0",
              "font-medium whitespace-nowrap",
              STATUS_STYLES[appointment.status],
            )}
          >
            {appointment.status}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="font-medium">
            {formatTime(appointment.startsAt)} - {formatTime(appointment.endsAt)}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span>
            {LOCATION_ICONS[appointment.location]} {appointment.location}
          </span>
        </div>
      </div>
    
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: service?.color ?? "#037ECC" }}
      />
    </div>
  )
}
