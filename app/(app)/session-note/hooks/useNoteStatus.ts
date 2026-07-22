import type { NoteStatus } from "@/lib/types/appointment-note.types"

export interface NoteStatusInfo {
  status: NoteStatus
  label: string
  isDataCollectionEditable: boolean
  isFormEditable: boolean
  canSave: boolean
  canLock: boolean
  canActivate: boolean
  bannerVariant: "info" | "success" | "warning" | "danger"
  bannerMessage: string
  bannerDescription: string
}

export function deriveNoteStatusInfo(noteStatus: NoteStatus, isAdmin: boolean): NoteStatusInfo {
  switch (noteStatus) {
    case "read":
      return {
        status: "read",
        label: "Read Only",
        isDataCollectionEditable: true,
        isFormEditable: false,
        canSave: true,
        canLock: false,
        canActivate: false,
        bannerVariant: "info",
        bannerMessage: "Session in progress — limited editing",
        bannerDescription: "Only data collection fields are editable until the appointment is completed",
      }
    case "active":
      return {
        status: "active",
        label: "Active",
        isDataCollectionEditable: true,
        isFormEditable: true,
        canSave: true,
        canLock: false,
        canActivate: false,
        bannerVariant: "success",
        bannerMessage: "Editing is enabled",
        bannerDescription: "Complete and save the session note before the editing window closes",
      }
    case "close":
      return {
        status: "close",
        label: "Closed",
        isDataCollectionEditable: false,
        isFormEditable: false,
        canSave: false,
        canLock: isAdmin,
        canActivate: isAdmin,
        bannerVariant: "warning",
        bannerMessage: "This session note is closed",
        bannerDescription: isAdmin
          ? "You can lock it for billing or re-activate it for editing"
          : "The editing window has expired. Contact an administrator to re-open",
      }
    case "lock":
      return {
        status: "lock",
        label: "Locked",
        isDataCollectionEditable: false,
        isFormEditable: false,
        canSave: false,
        canLock: false,
        canActivate: false,
        bannerVariant: "danger",
        bannerMessage: "This session note is permanently locked",
        bannerDescription: "It has been sent to billing and cannot be modified",
      }
  }
}
