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
} from "lucide-react"
import { CalendarToolbar } from "./CalendarToolbar"
import { MonthCalendar } from "./MonthCalendar"
import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, isSameDay, parseISO } from "date-fns"
import { Button } from "@/components/custom/Button"
import { AppointmentCard } from "./AppointmentCard"
import { AppointmentModal } from "./AppointmentModal"
import { DuplicateAppointmentModal } from "./DuplicateAppointmentModal"
import { SupervisionConfigModal } from "./SupervisionConfigModal"
import { AppointmentContextMenu } from "./AppointmentContextMenu"
import { useWeekCalendar, CALENDAR_HOURS, SLOT_HEIGHT } from "../hooks/useWeekCalendar"
import type { CalendarScope, CalendarViewMode } from "../hooks/useWeekCalendar"
import { useScheduleEventColors } from "@/lib/modules/schedules/hooks/use-schedule-event-colors"
import { buildSessionNoteUrl, buildDataCollectionUrl } from "@/lib/modules/schedules/utils/schedule-display"
import { getBillingCodeAction } from "@/lib/modules/schedules/utils/billing-code-supervision-rules"
import { deleteSubEvent } from "@/lib/modules/schedules/services/appointment-sub-event.service"
import { useAppointmentMutations } from "@/lib/modules/schedules/hooks/use-appointment-mutations"
import { getAppointmentById } from "@/lib/modules/schedules/services/appointments.service"
import { useAppointments } from "@/lib/store/appointments.store"
import { getCurrentTime } from "@/lib/utils/unit-calculation"
import { useAlert } from "@/lib/contexts/alert-context"
import { usePermission } from "@/lib/hooks/use-permission"
import { useUsers } from "@/lib/modules/users/hooks/use-users"
import { PermissionModule } from "@/lib/utils/permissions-new"
import { isToday, formatWeekRange } from "@/lib/date"
import { FilterSelect } from "@/components/custom/FilterSelect"
import { FloatingSelect } from "@/components/custom/FloatingSelect"
import { Card } from "@/components/custom/Card"
import { cn } from "@/lib/utils"
import { useClientsByLoggedUser } from "@/lib/modules/clients/hooks/use-clients-by-logged-user"
import type { AppointmentStatus } from "@/lib/types/appointment.types"


/** Fixed card height for the agency list view (no time-grid positioning) */
const INLINE_CARD_HEIGHT = 90

interface WeekCalendarProps {
  rbtId: string
  viewMode?: CalendarViewMode
  scope?: CalendarScope
}


const STATUS_OPTIONS: Array<{ value: AppointmentStatus | "all"; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "NoShow", label: "No Show" },
]



export function WeekCalendar({
  rbtId,
  viewMode = "client",
  scope = "provider",
}: WeekCalendarProps) {
  const router = useRouter()
  const { selectedAppointment, deleteAppointment } = useAppointments()
  const { create: canCreateSession } = usePermission()
  const eventColors = useScheduleEventColors()
  const mutations = useAppointmentMutations()
  const alert = useAlert()
  const canCreate = canCreateSession(PermissionModule.SCHEDULE)
  const isAgency = scope === "agency"
  const { users: allUsers } = useUsers({ pageSize: 100 })
  const { clients } = useClientsByLoggedUser({ page: 0, pageSize: 200 })

  // Only show users that have a role (not clients) and are active
  const providerFilterOptions = useMemo(() => {
    const validProviders = allUsers
      .filter((u) => u.active && !u.terminated && u.roleName)
      .map((u) => ({ value: u.id, label: u.fullName }))
    return [{ value: "all", label: "All Providers" }, ...validProviders]
  }, [allUsers])

  const clientFilterOptions = useMemo(() => {
    const clientOpts = clients
      .filter((c) => c.fullName)
      .map((c) => ({ value: c.id, label: c.fullName }))
    return [{ value: "all", label: "All Clients" }, ...clientOpts]
  }, [clients])
  
  const {
    calendarView,
    weekStart,
    monthStart,
    monthDays,
    weekDays,
    displayDays,
    selectedDay,
    activeAppointment,
    showModal,
    showDuplicateModal,
    showSupervisionModal,
    supervisionAppointment,
    parentAppointment,
    modalDefaults,
    contextMenu,
    filterClient,
    filterStatus,
    filterLocation,
    filterProvider,
    filteredAppointments,
    isLoadingAppointments,
    hoveredSlot,
    clickedSlot,
    isMobile,
    viewMode: calendarViewMode,
    actions,
  } = useWeekCalendar({ rbtId, viewMode, scope })
  
  // Resolve the appointment behind the context menu for status-aware rendering
  const contextMenuAppointment = contextMenu
    ? filteredAppointments.find((apt) => apt.id === contextMenu.appointmentId)
    : null

  const contextMenuBillingCodeAction = contextMenuAppointment
    ? getBillingCodeAction(contextMenuAppointment.billingCodeName)
    : "none"

  // Unified menu action handler — navigation + delete-with-confirm + delegate to hook
  const handleMenuAction = useCallback(
    async (action: string, appointmentId: string) => {
      const appointment = useAppointments.getState().appointments.find(
        (apt) => apt.id === appointmentId,
      )

      if ((action === "session_note" || action === "sup_session_note") && appointment) {
        router.push(buildSessionNoteUrl(appointment))
        actions.closeContextMenu()
        return
      }

      if ((action === "data_collection" || action === "sup_data_collection") && appointment) {
        // If the appointment doesn't have clientServicePlanId, try fetching the full appointment
        let resolvedAppointment = appointment
        if (!resolvedAppointment.clientServicePlanId) {
          try {
            const full = await getAppointmentById(resolvedAppointment.id)
            if (full?.clientServicePlanId) {
              resolvedAppointment = full
            }
          } catch {
            // ignore fetch error, proceed with original
          }
        }
        if (!resolvedAppointment.clientServicePlanId) {
          alert.error("No Service Plan", "This client does not have a service plan configured. Please assign one before accessing Data Collection.")
          actions.closeContextMenu()
          return
        }
        router.push(buildDataCollectionUrl(resolvedAppointment))
        actions.closeContextMenu()
        return
      }

      // Delete sub-event (supervision or session/supervision)
      if (action === "delete_sub_event" && appointment?.supervision) {
        actions.closeContextMenu()
        // Resolve sub-event ID: try from list data, fallback to GET detail
        const resolveSubEventId = async (): Promise<string | null> => {
          if (appointment.supervision?.id) return appointment.supervision.id
          const full = await getAppointmentById(appointment.id)
          return full?.supervision?.id ?? null
        }
        alert.confirm({
          title: "Delete Sub-Event",
          description: "Are you sure you want to delete this sub-event? This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Go Back",
          onConfirm: async () => {
            const subEventId = await resolveSubEventId()
            if (!subEventId) {
              alert.error("Error", "Could not find the sub-event ID")
              return
            }
            await deleteSubEvent(subEventId)
            actions.handleAppointmentSaved()
          },
        })
        return
      }

      // "Edit Session" for session/supervision sub-events (parent is 97153/97152)
      if (action === "edit_session_supervision" && appointment) {
        actions.closeContextMenu()
        actions.openSupervisionModal(appointment)
        return
      }

      // "Add New Session" for 97153/97152 — open appointment modal with parent context
      if (action === "add_new_session" && appointment) {
        actions.closeContextMenu()
        actions.openNewSessionFromParent(appointment)
        return
      }

      if (action === "delete") {
        actions.closeContextMenu()
        alert.confirm({
          title: "Delete Session",
          description:
            "Are you sure you want to delete this session? This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Go Back",
          onConfirm: async () => {
            deleteAppointment(appointmentId)
            await mutations.remove(appointmentId)
          },
        })
        return
      }

      actions.handleContextMenuAction(action, appointmentId)
    },
    [router, actions, alert, deleteAppointment, mutations],
  )

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
            onClick={actions.goToPrev}
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
            onClick={actions.goToNext}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      ) : (
        <CalendarToolbar
          calendarView={calendarView}
          weekStart={weekStart}
          monthStart={monthStart}
          canCreate={canCreate}
          onViewChange={actions.setCalendarView}
          onPrev={actions.goToPrev}
          onNext={actions.goToNext}
          onToday={actions.goToToday}
          onDateSelect={actions.goToDate}
          onNewSession={() => actions.openNewAppointmentModal()}
        />
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
        <Card variant="elevated" padding="md">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <FloatingSelect
                label="Client"
                value={filterClient}
                onChange={actions.setFilterClient}
                options={clientFilterOptions}
                searchable
              />
            </div>

            <div className="flex-1 min-w-0">
              <FilterSelect
                value={filterProvider}
                onChange={actions.setFilterProvider}
                options={providerFilterOptions}
                placeholder="All Providers"
                fullWidth
              />
            </div>

            <div className="flex-1 min-w-0">
              <FilterSelect
                value={filterStatus}
                onChange={(v) => actions.setFilterStatus(v as AppointmentStatus | "all")}
                options={STATUS_OPTIONS}
                placeholder="All Status"
                fullWidth
              />
            </div>

            {(filterClient !== "all" || filterStatus !== "all" || filterProvider !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  actions.setFilterClient("all")
                  actions.setFilterStatus("all")
                  actions.setFilterProvider("all")
                }}
                className="whitespace-nowrap h-[52px] 2xl:h-[56px]"
              >
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      )}
      
      {/* ─── Month grid view ─── */}
      {calendarView === "month" && !isMobile && (
        <MonthCalendar
          monthStart={monthStart}
          monthDays={monthDays}
          appointments={filteredAppointments}
          isLoading={isLoadingAppointments}
          onDayClick={(date) => {
            actions.goToDate(date)
            actions.setCalendarView("week")
          }}
          onAppointmentMenu={actions.openMenuAt}
          isMenuOpen={!!contextMenu}
        />
      )}

      {/* ─── Agency list view: appointments stacked vertically per day ─── */}
      {calendarView === "week" && !isMobile && isAgency ? (
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          {isLoadingAppointments && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#037ECC] border-t-transparent" />
                Loading sessions...
              </div>
            </div>
          )}
          <div className="p-4 min-w-[1100px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
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

            {/* Day columns with stacked appointments */}
            <div className="grid grid-cols-7 gap-1" style={{ minHeight: "calc(100vh - 300px)" }}>
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = filteredAppointments
                  .filter((apt) => isSameDay(parseISO(apt.startsAt), day))
                  .sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime())

                return (
                  <div
                    key={dayIndex}
                    className="overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl bg-gray-50/30 p-1 space-y-1"
                  >
                    {/* Add button at the top */}
                    <button
                      type="button"
                      onClick={() => actions.openNewAppointmentModal({ date: format(day, "yyyy-MM-dd"), time: getCurrentTime() })}
                      className="flex items-center justify-center w-full py-1.5 text-[10px] font-medium text-gray-400 cursor-pointer hover:bg-[#037ECC]/5 hover:text-[#037ECC] rounded-lg transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      Add
                    </button>
                    {dayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        onContextMenu={(e) => actions.openContextMenu(e, appointment.id)}
                      >
                        <AppointmentCard
                          appointment={appointment}
                          viewMode={calendarViewMode}
                          layout="list"
                          eventColors={eventColors}
                          onClick={() => actions.openEditModal(appointment)}
                          onOpenMenu={(x, y) => actions.openMenuAt(x, y, appointment.id)}
                          onOpenSupervisionMenu={(x, y) => actions.openSupervisionMenuAt(x, y, appointment.id)}
                        />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : calendarView === "week" && !isMobile ? (
      /* ─── Provider time-grid view: appointments positioned by time slot ─── */
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {isLoadingAppointments && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#037ECC] border-t-transparent" />
              Loading sessions...
            </div>
          </div>
        )}
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
                      <div key={displayIndex} className="relative pointer-events-auto overflow-visible">
                        {filteredAppointments.map((appointment) => {
                          const position = actions.getAppointmentPosition(appointment)
                          if (!position || position.dayIndex !== dayIndex) return null

                          return (
                            <div
                              key={appointment.id}
                              className="absolute left-0.5 right-0.5 overflow-visible hover:z-[60]"
                              style={{
                                top: `${position.top}px`,
                                height: `${Math.max(position.height - 2, 40)}px`,
                                zIndex: 30,
                              }}
                              onContextMenu={(e) => actions.openContextMenu(e, appointment.id)}
                            >
                              <AppointmentCard
                                appointment={appointment}
                                viewMode={calendarViewMode}
                                eventColors={eventColors}
                                cardHeight={Math.max(position.height - 2, 40)}
                                onClick={() => actions.openEditModal(appointment)}
                                onOpenMenu={(x, y) => actions.openMenuAt(x, y, appointment.id)}
                                onOpenSupervisionMenu={(x, y) => actions.openSupervisionMenuAt(x, y, appointment.id)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>

              {isMobile && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="grid grid-cols-[50px_1fr] gap-1">
                    <div />
                    <div className="relative">
                      {CALENDAR_HOURS.map((hour) => {
                        const day = displayDays[0]
                        const slotId = `slot-${format(day, "yyyy-MM-dd")}-${hour}`
                        const dayIndex = selectedDay
                        const isHovered = hoveredSlot === slotId
                        const isClicked = clickedSlot === slotId
                        const hasCovering = actions.hasAppointmentCoveringSlot(dayIndex, hour)

                        return (
                          <div
                            key={slotId}
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
                  </div>
                </div>
              )}

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
                  viewMode={calendarViewMode}
                  eventColors={eventColors}
                  isDragOverlay
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      ) : null}
      
      {isMobile && canCreate && (
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
        parentAppointment={parentAppointment}
        defaultDate={modalDefaults.date}
        defaultTime={modalDefaults.time}
        rbtId={rbtId}
        scope={scope}
        onStatusChange={actions.handleStatusChange}
        onSaved={actions.handleAppointmentSaved}
      />
      
      <DuplicateAppointmentModal
        open={showDuplicateModal}
        onClose={actions.closeDuplicateModal}
        appointment={selectedAppointment}
        rbtId={rbtId}
        onDuplicated={actions.handleAppointmentSaved}
      />

      <SupervisionConfigModal
        open={showSupervisionModal}
        onClose={actions.closeSupervisionModal}
        onSaved={actions.handleAppointmentSaved}
        appointment={supervisionAppointment}
      />

      {contextMenu && (
        <AppointmentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          appointmentId={contextMenu.appointmentId}
          appointmentStatus={contextMenuAppointment?.status}
          hasSupervision={!!contextMenuAppointment?.supervision}
          billingCodeAction={contextMenuBillingCodeAction}
          isSupervision={contextMenu.isSupervision}
          parentBillingCodeAction={contextMenu.isSupervision ? contextMenuBillingCodeAction : undefined}
          onAction={handleMenuAction}
          onClose={actions.closeContextMenu}
        />
      )}
    </div>
  )
}
