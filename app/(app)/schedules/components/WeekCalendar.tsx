"use client"

import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Search, 
  Filter, 
  X 
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/custom/Button"
import { AppointmentCard } from "./AppointmentCard"
import { AppointmentModal } from "./AppointmentModal"
import { DuplicateAppointmentModal } from "./DuplicateAppointmentModal"
import { AppointmentContextMenu } from "./AppointmentContextMenu"
import { useWeekCalendar, CALENDAR_HOURS, SLOT_HEIGHT } from "../hooks/useWeekCalendar"
import { useAppointments } from "@/lib/store/appointments.store"
import { isToday, formatWeekRange } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { AppointmentStatus, AppointmentLocation } from "@/lib/types/appointment.types"


interface WeekCalendarProps {
  rbtId: string
}


const STATUS_OPTIONS: Array<{ value: AppointmentStatus | "all"; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
]

const LOCATION_OPTIONS: Array<{ value: AppointmentLocation | "all"; label: string }> = [
  { value: "all", label: "All Locations" },
  { value: "Clinic", label: "Clinic" },
  { value: "Home", label: "Home" },
  { value: "School", label: "School" },
  { value: "Telehealth", label: "Telehealth" },
]


export function WeekCalendar({ rbtId }: WeekCalendarProps) {
  const { selectedAppointment } = useAppointments()
  
  const {
    weekStart,
    weekDays,
    displayDays,
    selectedDay,
    activeAppointment,
    showModal,
    showDuplicateModal,
    modalDefaults,
    contextMenu,
    searchQuery,
    filterStatus,
    filterLocation,
    filteredAppointments,
    hoveredSlot,
    clickedSlot,
    isMobile,
    actions,
  } = useWeekCalendar({ rbtId })
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )
  
  return (
    <div className="space-y-4 min-h-screen">
      {isMobile ? (
  
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
          <button
            onClick={actions.goToPrevWeek}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className="text-base font-semibold text-gray-900">
              {format(weekDays[selectedDay], "EEEE d")}
            </div>
            <div className="text-xs text-gray-500">
              {format(weekDays[selectedDay], "MMMM yyyy")}
            </div>
          </div>
          
          <button
            onClick={actions.goToToday}
            className="px-3 py-1.5 text-sm font-medium text-[#037ECC] hover:bg-[#037ECC]/5 rounded-lg transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={actions.goToNextWeek}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      ) : (

        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={actions.goToPrevWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={actions.goToToday}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CalendarIcon className="h-4 w-4" />
              Today
            </button>
            
            <button
              onClick={actions.goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-900">
            Week of {formatWeekRange(weekStart)}
          </h2>
          
          <Button
            variant="primary"
            onClick={() => actions.openNewAppointmentModal()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      )}
      
      {isMobile && (
        <div className="flex gap-1 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {weekDays.map((day, index) => (
            <button
              key={index}
              onClick={() => actions.setSelectedDay(index)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all",
                selectedDay === index
                  ? "bg-[#037ECC] text-white shadow-lg shadow-[#037ECC]/30"
                  : "bg-white text-gray-600 hover:bg-gray-50",
                isToday(day) && selectedDay !== index && "ring-2 ring-[#037ECC]/30",
              )}
            >
              <span className="text-xs font-medium">{format(day, "EEE")}</span>
              <span className="text-lg font-bold">{format(day, "d")}</span>
            </button>
          ))}
        </div>
      )}
      
      {!isMobile && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search client..."
              value={searchQuery}
              onChange={(e) => actions.setSearchQuery(e.target.value)}
              className={cn(
                "w-full h-10 pl-10 pr-4 rounded-lg",
                "border border-gray-200 bg-white",
                "text-sm placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-[#037ECC]/20 focus:border-[#037ECC]",
              )}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            
            <select
              value={filterStatus}
              onChange={(e) => actions.setFilterStatus(e.target.value as AppointmentStatus | "all")}
              className={cn(
                "h-10 px-3 rounded-lg border bg-white text-sm",
                filterStatus !== "all"
                  ? "border-[#037ECC] text-[#037ECC]"
                  : "border-gray-200 text-gray-600",
              )}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          
            <select
              value={filterLocation}
              onChange={(e) => actions.setFilterLocation(e.target.value as AppointmentLocation | "all")}
              className={cn(
                "h-10 px-3 rounded-lg border bg-white text-sm",
                filterLocation !== "all"
                  ? "border-[#037ECC] text-[#037ECC]"
                  : "border-gray-200 text-gray-600",
              )}
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            
            {(searchQuery || filterStatus !== "all" || filterLocation !== "all") && (
              <button
                onClick={() => {
                  actions.setSearchQuery("")
                  actions.setFilterStatus("all")
                  actions.setFilterLocation("all")
                }}
                className="h-10 px-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={actions.handleDragStart}
          onDragEnd={actions.handleDragEnd}
        >
          <div className={cn("p-4", isMobile ? "min-w-0" : "min-w-[1100px]")}>
            {!isMobile && (
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-2">
                <div /> 
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col items-center py-3 rounded-xl transition-colors",
                      isToday(day)
                        ? "bg-[#037ECC] text-white"
                        : "bg-gray-50 text-gray-700",
                    )}
                  >
                    <span className="text-xs font-medium uppercase opacity-80">
                      {format(day, "EEE")}
                    </span>
                    <span className="text-2xl font-bold">{format(day, "d")}</span>
                    <span className="text-xs opacity-70">{format(day, "MMM")}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="relative">
              <div className="relative">
                {CALENDAR_HOURS.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      "grid gap-1 border-t border-gray-100",
                      isMobile ? "grid-cols-[50px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]",
                    )}
                    style={{ height: SLOT_HEIGHT }}
                  >
  
                    <div className="text-xs text-gray-400 font-medium pt-1 text-right pr-2">
                      {hour}:00
                    </div>
                  
                    {displayDays.map((_, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="border-l border-gray-100 bg-gray-50/30"
                      />
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className={cn(
                    "grid gap-1 h-full",
                    isMobile ? "grid-cols-[50px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]",
                  )}
                >
                  {!isMobile && <div />}
                  {isMobile && <div />}
                  
                  {displayDays.map((_, displayIndex) => {
                    const dayIndex = isMobile ? selectedDay : displayIndex
                    
                    return (
                      <div key={displayIndex} className="relative pointer-events-auto">
                        {filteredAppointments.map((appointment) => {
                          const position = actions.getAppointmentPosition(appointment)
                          if (!position || position.dayIndex !== dayIndex) return null
                          
                          return (
                            <div
                              key={appointment.id}
                              className="absolute left-0.5 right-0.5"
                              style={{
                                top: `${position.top}px`,
                                height: `${Math.max(position.height - 2, 40)}px`,
                                zIndex: 30,
                              }}
                              onContextMenu={(e) => actions.openContextMenu(e, appointment.id)}
                            >
                              <AppointmentCard
                                appointment={appointment}
                                onClick={() => actions.openEditModal(appointment)}
                                onStatusChange={(status) => 
                                  actions.handleStatusChange(appointment.id, status)
                                }
                              />
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {!isMobile && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                    <div /> 
                    {weekDays.map((day, dayIndex) => (
                      <div key={dayIndex} className="relative">
                        {CALENDAR_HOURS.map((hour) => {
                          const slotId = `slot-${format(day, "yyyy-MM-dd")}-${hour}`
                          const isHovered = hoveredSlot === slotId
                          const isClicked = clickedSlot === slotId
                          const hasCovering = actions.hasAppointmentCoveringSlot(dayIndex, hour)
                          
                          return (
                            <div
                              key={slotId}
                              id={`slot-${dayIndex}-${hour}`}
                              onClick={() => !hasCovering && actions.handleSlotClick(day, hour)}
                              onMouseEnter={() => !hasCovering && actions.setHoveredSlot(slotId)}
                              onMouseLeave={() => actions.setHoveredSlot(null)}
                              className={cn(
                                "absolute left-0 right-0 pointer-events-auto",
                                "transition-colors duration-150",
                                !hasCovering && "cursor-pointer hover:bg-[#037ECC]/5",
                                isClicked && "bg-[#037ECC]/10",
                                hasCovering && "pointer-events-none",
                              )}
                              style={{
                                top: `${(hour - 7) * SLOT_HEIGHT}px`,
                                height: `${SLOT_HEIGHT}px`,
                              }}
                            >
                              {isHovered && !hasCovering && (
                                <button
                                  className={cn(
                                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                                    "w-6 h-6 rounded-full",
                                    "bg-[#037ECC] text-white",
                                    "flex items-center justify-center",
                                    "shadow-lg shadow-[#037ECC]/30",
                                    "opacity-0 group-hover:opacity-100",
                                    "animate-in fade-in zoom-in duration-200",
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    actions.handleSlotClick(day, hour)
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DragOverlay>
            {activeAppointment && (
              <div className="w-48">
                <AppointmentCard 
                  appointment={activeAppointment} 
                  isDragOverlay 
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      
      {isMobile && (
        <button
          onClick={() => actions.openNewAppointmentModal()}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-14 h-14 rounded-full",
            "bg-[#037ECC] text-white",
            "flex items-center justify-center",
            "shadow-xl shadow-[#037ECC]/30",
            "hover:bg-[#025ea0] active:scale-95",
            "transition-all duration-200",
          )}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
      
      <AppointmentModal
        open={showModal}
        onClose={actions.closeModal}
        appointment={selectedAppointment}
        defaultDate={modalDefaults.date}
        defaultTime={modalDefaults.time}
        rbtId={rbtId}
      />
      
      <DuplicateAppointmentModal
        open={showDuplicateModal}
        onClose={actions.closeDuplicateModal}
        appointment={selectedAppointment}
        rbtId={rbtId}
      />
      
      {contextMenu && (
        <AppointmentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          appointmentId={contextMenu.appointmentId}
          onAction={actions.handleContextMenuAction}
          onClose={actions.closeContextMenu}
        />
      )}
    </div>
  )
}
