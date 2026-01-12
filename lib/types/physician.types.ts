export type PhysicianSpecialty =
  | "Cardiology"
  | "Dermatology"
  | "Endocrinology"
  | "Gastroenterology"
  | "Hematology"
  | "Nephrology"
  | "Neurology"
  | "Gynecology"
  | "Oncology"
  | "Ophthalmology"
  | "Otolaryngology"
  | "Pediatrics"
  | "Psychiatry"
  | "Pulmonology"
  | "Radiology"
  | "Rheumatology"
  | "Surgery"
  | "Urology"
  | "Immunology"
  | "Anesthesiology"
  | "Pathology";

export interface Physician {
  id: string;
  firstName: string;
  lastName: string;
  specialty: PhysicianSpecialty;
  npi: string;
  mpi: string;
  phone: string;
  fax: string;
  email: string;
  type: string;
  active: boolean;
  isDefault: boolean;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  countryId?: string;
  stateId?: string;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePhysicianRequest {
  firstName: string;
  lastName: string;
  specialty: PhysicianSpecialty;
  npi: string;
  mpi: string;
  phone: string;
  fax?: string;
  email: string;
  type: string;
  active: boolean;
  isDefault: boolean;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  countryId?: string;
  stateId?: string;
}

export interface UpdatePhysicianRequest extends CreatePhysicianRequest {
  id: string;
}

export interface PhysiciansListResponse {
  data: {
    entities: Physician[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface PhysicianResponse {
  data: Physician;
}

export interface PhysicianType {
  id: string;
  name: string;
  code: string;
}

export const PHYSICIAN_SPECIALTIES: { label: string; value: PhysicianSpecialty }[] = [
  { label: "Cardiology", value: "Cardiology" },
  { label: "Dermatology", value: "Dermatology" },
  { label: "Endocrinology", value: "Endocrinology" },
  { label: "Gastroenterology", value: "Gastroenterology" },
  { label: "Hematology", value: "Hematology" },
  { label: "Nephrology", value: "Nephrology" },
  { label: "Neurology", value: "Neurology" },
  { label: "Gynecology", value: "Gynecology" },
  { label: "Oncology", value: "Oncology" },
  { label: "Ophthalmology", value: "Ophthalmology" },
  { label: "Otolaryngology", value: "Otolaryngology" },
  { label: "Pediatrics", value: "Pediatrics" },
  { label: "Psychiatry", value: "Psychiatry" },
  { label: "Pulmonology", value: "Pulmonology" },
  { label: "Radiology", value: "Radiology" },
  { label: "Rheumatology", value: "Rheumatology" },
  { label: "Surgery", value: "Surgery" },
  { label: "Urology", value: "Urology" },
  { label: "Immunology", value: "Immunology" },
  { label: "Anesthesiology", value: "Anesthesiology" },
  { label: "Pathology", value: "Pathology" },
];

export const PHYSICIAN_TYPES = [
  { label: "Primary Care", value: "primary_care" },
  { label: "Specialist", value: "specialist" },
  { label: "Consulting", value: "consulting" },
];
