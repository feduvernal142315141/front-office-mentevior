import type { GeneralInformationFormValues } from "@/lib/schemas/general-information.schema"

export const mockGeneralInformation: GeneralInformationFormValues = {
  firstName: "John",
  lastName: "Doe",
  birthday: "1990-05-15",
  country: "United States",
  state: "1",
  city: "Miami",
  zipCode: "33101",
  homeAddressLine1: "123 Ocean Drive, Apt 4B",
  email: "john.doe@example.com",
  cellphone: "(305) 555-1234",
  roleId: "",
  hiringDate: "2020-01-15",
  ssn: "123-45-6789",
  npi: "1234567890",
  mpi: "9876543210",
  caqhNumber: "1122334455",
  companyName: "Healthcare Solutions Inc.",
  ein: "123456789",
  employerId: "987654321",
}

export const mockGeneralInformationWithRBT: GeneralInformationFormValues = {
  ...mockGeneralInformation,
  roleId: "rbt-role-id",
}

export const mockGeneralInformationWithBCBA: GeneralInformationFormValues = {
  ...mockGeneralInformation,
  roleId: "bcba-role-id",
  firstName: "Sarah",
  lastName: "Smith",
  email: "sarah.smith@example.com",
  cellphone: "(305) 555-9876",
  npi: "9876543210",
  birthday: "1985-08-22",
  hiringDate: "2018-03-10",
  ssn: "987-65-4321",
}

export const mockGeneralInformationMinimal: GeneralInformationFormValues = {
  firstName: "Mike",
  lastName: "Johnson",
  birthday: "1992-11-30",
  country: "1",
  state: "2",
  city: "Orlando",
  zipCode: "32801",
  homeAddressLine1: "456 Park Avenue",
  email: "mike.johnson@example.com",
  cellphone: "(407) 555-5678",
  roleId: "",
  hiringDate: "2021-06-01",
  ssn: "555-44-3333",
  npi: "",
  mpi: "",
  caqhNumber: "",
  companyName: "",
  ein: "",
  employerId: "",
}
