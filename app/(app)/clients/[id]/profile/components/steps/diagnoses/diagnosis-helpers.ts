import type { Diagnosis } from "@/lib/types/diagnosis.types"
import type { Physician } from "@/lib/types/physician.types"
import { getPhysicianFormDefaults, type PhysicianFormData } from "@/lib/schemas/physician-form.schema"

export type SelectedReferringPhysician = {
  physicianId: string
  fullName: string
  specialty?: string
  type?: string
  source: "agency" | "manual" | "diagnosis"
}

export const MAX_SIZE_MB = 25

/**
 * Formatos que el visor de documentos sabe renderizar. El input se limita a
 * éstos: antes aceptaba cualquier cosa y un `.docx` subía bien pero luego "View"
 * no lo podía mostrar.
 */
export const ACCEPTED_ATTACHMENT_TYPES = ".pdf,.png,.jpg,.jpeg,.webp"
export const ACCEPTED_ATTACHMENT_LABEL = "PDF, PNG, JPG o WEBP"

const EXTENSION_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? result)
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

export function getFileExtension(fileName: string | null | undefined): string {
  return (fileName ?? "").split(".").pop()?.toLowerCase() ?? ""
}

export function isSupportedAttachment(fileName: string | null | undefined): boolean {
  return getFileExtension(fileName) in EXTENSION_MIME
}

export function getMimeTypeFromName(fileName: string | null | undefined): string {
  return EXTENSION_MIME[getFileExtension(fileName)] ?? "application/octet-stream"
}

export function getFileNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const segment = parsed.pathname.split("/").pop()
    return segment ? decodeURIComponent(segment) : null
  } catch {
    return null
  }
}

export function buildDiagnosisPhysician(diagnosis: Diagnosis | null): SelectedReferringPhysician | null {
  if (!diagnosis?.physicianId) {
    return null
  }

  const fullName =
    diagnosis.physicianName?.trim() ||
    [diagnosis.physicianFirstName, diagnosis.physicianLastName].filter(Boolean).join(" ") ||
    "Physician selected"

  return {
    physicianId: diagnosis.physicianId,
    fullName,
    specialty: diagnosis.physicianSpecialty,
    type: diagnosis.physicianType,
    source: "diagnosis",
  }
}

export function mapPhysicianToFormValues(physician: Physician, usaCountryId?: string): PhysicianFormData {
  return {
    firstName: physician.firstName,
    lastName: physician.lastName,
    specialty: physician.specialty,
    npi: physician.npi,
    mpi: physician.mpi,
    phone: physician.phone,
    fax: physician.fax || "",
    email: physician.email || "",
    type: physician.type,
    active: physician.active,
    isDefault: physician.isDefault,
    companyName: physician.companyName || "",
    address: physician.address || "",
    countryId: physician.countryId || usaCountryId || "",
    stateId: physician.stateId || "",
    city: physician.city || "",
    zipCode: physician.zipCode || "",
    country: physician.country || "United States",
    state: physician.state || "",
  }
}

export { getPhysicianFormDefaults }
export type { PhysicianFormData }
