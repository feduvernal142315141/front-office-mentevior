import type { AssessmentStatus } from "@/lib/types/assessment.types"

export interface AssessmentStatusInfo {
  status: AssessmentStatus
  label: string
  isFormEditable: boolean
  canSave: boolean
  canLock: boolean
  canActivate: boolean
  bannerVariant: "info" | "success" | "warning" | "danger"
  bannerMessage: string
  bannerDescription: string
}

/**
 * Derive UI rules from assessment status + detail `notCanEdit`.
 * `canAdminAction` gates Re-Activate / Lock (ASSESSMENT_BLOCK + admin).
 */
export function deriveAssessmentStatusInfo(
  status: AssessmentStatus,
  canAdminAction: boolean,
  notCanEdit: boolean,
): AssessmentStatusInfo {
  switch (status) {
    case "read":
      return {
        status: "read",
        label: "Read",
        isFormEditable: !notCanEdit,
        canSave: !notCanEdit,
        canLock: false,
        canActivate: false,
        bannerVariant: "info",
        bannerMessage: "Service plan appointment in progress",
        bannerDescription: notCanEdit
          ? "Editing is currently disabled for this assessment"
          : "You can edit this assessment while the linked appointment is open",
      }
    case "active":
      return {
        status: "active",
        label: "Active",
        isFormEditable: !notCanEdit,
        canSave: !notCanEdit,
        canLock: false,
        canActivate: false,
        bannerVariant: "success",
        bannerMessage: "Editing is enabled",
        bannerDescription: "Complete and save the assessment before the editing window closes",
      }
    case "close":
      return {
        status: "close",
        label: "Closed",
        isFormEditable: false,
        canSave: false,
        canLock: canAdminAction,
        canActivate: canAdminAction,
        bannerVariant: "warning",
        bannerMessage: "This assessment is closed",
        bannerDescription: canAdminAction
          ? "You can lock it for billing or re-activate it for editing"
          : "The editing window has expired. Contact an administrator to re-open",
      }
    case "lock":
      return {
        status: "lock",
        label: "Locked",
        isFormEditable: false,
        canSave: false,
        canLock: false,
        canActivate: false,
        bannerVariant: "danger",
        bannerMessage: "This assessment is permanently locked",
        bannerDescription: "It has been locked for billing and cannot be modified",
      }
  }
}

export const ASSESSMENT_STATUS_BADGE: Record<
  AssessmentStatus,
  { label: string; className: string }
> = {
  read: {
    label: "Read",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  close: {
    label: "Closed",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  lock: {
    label: "Locked",
    className: "bg-red-50 text-red-700 border-red-200",
  },
}
