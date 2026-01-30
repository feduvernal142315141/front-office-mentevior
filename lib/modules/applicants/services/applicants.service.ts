import { serviceGet, servicePut } from "@/lib/services/baseService"
import type {
  Applicant,
  MarkApplicantAsReadRequest
} from "@/lib/types/applicant.types"
import type { PaginatedResponse } from "@/lib/types/response.types"
import { getQueryString } from "@/lib/utils/format"
import type { QueryModel } from "@/lib/models/queryModel"

/**
 * Get paginated list of applicants
 */
export async function getApplicants(query: QueryModel): Promise<{ applicants: Applicant[], totalCount: number }> {
  const response = await serviceGet<PaginatedResponse<Applicant>>(`/company/applicant${
    query ? `?${getQueryString(query)}` : ''
  }`)
  
  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch applicants")
  }
  
  const paginatedData = response.data as unknown as PaginatedResponse<Applicant>
  
  if (!paginatedData.entities || !Array.isArray(paginatedData.entities)) {
    console.error("Invalid backend response:", response.data)
    return { applicants: [], totalCount: 0 }
  }
  
  return {
    applicants: paginatedData.entities.map(normalizeApplicant),
    totalCount: paginatedData.pagination?.total || 0
  }
}

function normalizeApplicant(applicant: Applicant): Applicant {
  const licenseDate = applicant.licenseExpirationDate || applicant.licenceExpirationDate
  return {
    ...applicant,
    licenseExpirationDate: licenseDate,
  }
}

/**
 * Get a single applicant by ID
 */
export async function getApplicantById(applicantId: string): Promise<Applicant | null> {
  const response = await serviceGet<Applicant>(`/company/applicant/${applicantId}`)
  
  if (response.status === 404) {
    return null
  }

  if (response.status !== 200 || !response.data) {
    throw new Error(response.data?.message || "Failed to fetch applicant")
  }

  return normalizeApplicant(response.data as unknown as Applicant)
}

/**
 * Mark an applicant as read/unread
 */
export async function markApplicantAsRead(applicantId: string, isRead: boolean = true): Promise<void> {
  const data: MarkApplicantAsReadRequest = { applicantId, isRead }
  const response = await servicePut<MarkApplicantAsReadRequest, { message?: string }>(`/company/applicant/${applicantId}/mark-as-read`, data)

  if (response.status !== 200) {
    throw new Error(response.data?.message || "Failed to update applicant read status")
  }
}
