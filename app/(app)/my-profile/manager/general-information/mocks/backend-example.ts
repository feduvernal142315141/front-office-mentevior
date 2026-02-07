/**
 * EJEMPLO DE PAYLOAD PARA EL BACKEND
 * 
 * Este es el formato que el frontend enviará al backend
 * cuando el usuario actualice su General Information
 */

export const examplePayloadForBackend = {
  // Personal Information
  firstName: "John",
  lastName: "Doe",
  birthday: "1990-05-15", // formato ISO: YYYY-MM-DD
  country: "United States", // Por ahora es texto, siempre "United States"
  state: "1", // ID del estado (desde el catálogo de states)
  city: "Miami",
  zipCode: "33101",
  homeAddressLine1: "123 Ocean Drive, Apt 4B",
  email: "john.doe@example.com",
  cellphone: "(305) 555-1234",
  roleId: "uuid-del-rol", // UUID del rol desde la tabla roles
  hiringDate: "2020-01-15", // formato ISO: YYYY-MM-DD
  ssn: "123-45-6789", // formato: XXX-XX-XXXX
  
  // Professional Information (opcional según el rol)
  npi: "1234567890", // National Provider ID - solo números
  mpi: "9876543210", // Medicaid/Medicare Number - solo números
  caqhNumber: "1122334455", // CAQH Number - solo números
  companyName: "Healthcare Solutions Inc.", // obligatorio para RBT, BCBA, BCaBA
  ein: "123456789", // Employer Identification Number - solo números - obligatorio para RBT, BCBA, BCaBA
  employerId: "987654321", // Employer ID - solo números
}

/**
 * EJEMPLO DE RESPUESTA DEL BACKEND (GET)
 * 
 * Este es el formato que el backend debe devolver
 * cuando el frontend solicite la información del usuario
 */
export const exampleResponseFromBackend = {
  id: "uuid-del-usuario",
  
  // Personal Information
  firstName: "John",
  lastName: "Doe",
  birthday: "1990-05-15",
  country: {
    id: "1",
    name: "United States",
  },
  state: {
    id: "1",
    name: "Florida",
  },
  city: "Miami",
  zipCode: "33101",
  homeAddressLine1: "123 Ocean Drive, Apt 4B",
  email: "john.doe@example.com",
  cellphone: "(305) 555-1234",
  role: {
    id: "uuid-del-rol",
    name: "RBT",
  },
  hiringDate: "2020-01-15",
  ssn: "123-45-6789",
  
  // Professional Information
  professionalInfo: {
    npi: "1234567890",
    mpi: "9876543210",
    caqhNumber: "1122334455",
    companyName: "Healthcare Solutions Inc.",
    ein: "123456789",
    employerId: "987654321",
  },
  
  // Metadata
  createdAt: "2020-01-15T10:00:00Z",
  updatedAt: "2024-02-06T15:30:00Z",
  active: true,
  terminated: false,
}

/**
 * ENDPOINTS NECESARIOS:
 * 
 * 1. GET /api/member-users/:userId/general-information
 *    - Devuelve: exampleResponseFromBackend
 * 
 * 2. PUT /api/member-users/:userId/general-information
 *    - Recibe: examplePayloadForBackend
 *    - Devuelve: { success: true, data: exampleResponseFromBackend }
 * 
 * 3. GET /api/countries
 *    - Ya existe ✓
 * 
 * 4. GET /api/states?countryId={countryId}
 *    - Ya existe ✓
 * 
 * 5. GET /api/roles
 *    - Ya existe ✓
 */

/**
 * VALIDACIONES DEL BACKEND:
 * 
 * 1. SSN debe ser único en el sistema
 * 2. Email debe ser único en el tenant
 * 3. Si role es RBT, BCBA, BCaBA, o Supervisor:
 *    - npi, mpi, caqhNumber, employerId son OBLIGATORIOS
 * 4. Si role es RBT, BCBA, o BCaBA:
 *    - companyName y ein son OBLIGATORIOS
 * 5. Birthday debe ser fecha pasada
 * 6. HiringDate debe ser <= fecha actual
 * 7. ZipCode debe ser 5-9 dígitos
 * 8. Cellphone debe tener formato válido
 */
