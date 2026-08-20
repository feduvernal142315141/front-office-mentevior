/**
 * ProviderOnFile — otros proveedores del cliente a nivel compañía
 * (contrato 2026-08-19). Se asocian a los diagnósticos del cliente vía
 * `providerOnFileIds` y alimentan la sección Providers on File del PDF de
 * Assessment (regla interna del backend).
 *
 * ⚠️ El contrato escribe **`specialyId`** (sin la "t") en request y response;
 * no corregir, igual que `contactIformation` en Assessment.
 */

export interface ProviderOnFile {
  id: string
  firstName: string
  lastName: string
  agencyName: string
  specialyId: string
  /** Resueltos solo en el GET por id y en `providerOnFiles` de diagnosis */
  specialyName?: string
  specialyCode?: string
  phone: string
  email: string
}

export interface SaveProviderOnFileDto {
  firstName: string
  lastName: string
  agencyName: string
  specialyId: string
  phone: string
  email: string
}

/** `GET /specialty/catalog` (reemplaza a `/physician-specialty`) */
export interface SpecialtyCatalogItem {
  id: string
  name: string
  code: string
}
