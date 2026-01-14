export interface PhysicianSpecialty {
  id: string;
  name: string;
  code: string;
}

export interface PhysicianType {
  id: string;
  name: string;
  code: string;
}

export interface Physician {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
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
  specialty: string;
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
