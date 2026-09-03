// ============================================
// APPOINTMENT NOTE AI SUMMARY TYPES
// POST /ai/bedrock/appointment-note/improve-summary
// ============================================

/** `summaryType` values accepted for CPT 97155; omitted for 97153/97156 */
export type AppointmentNoteSummaryType =
  | "FACE_TO_FACE_OBSERVATION"
  | "PROTOCOL_ADJUSTMENTS"
  | "QHP_IMPLEMENTATION"
  | "ACTIVE_DIRECTION"

/** Request body for POST /ai/bedrock/appointment-note/improve-summary */
export interface ImproveAppointmentNoteSummaryPayload {
  billingCode: string
  summaryType?: AppointmentNoteSummaryType
  /**
   * Raw clinician notes from the ephemeral ABC field. The summary/narrative is
   * never sent here — only the AI result is written back into that field.
   */
  text: string
  /** JSON-serialized metadata object (the API expects a JSON string, not an object) */
  metadata: string
}
