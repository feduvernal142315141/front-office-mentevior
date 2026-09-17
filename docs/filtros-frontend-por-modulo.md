# Filtros usados en el frontend por módulo

Fecha: 2026-09-15. Inventario de todos los filtros, ordenamientos y paginación que
el frontend envía actualmente en cada listado. El objetivo es restringir el backend
a aceptar **solo** estos filtros.

Formato de filtro: `campo__OPERADOR__valor__LOGICA`
Prefijos de tipo: `UUID_`, `Date_`, `Boolean_`, `Integer_`, `String_` (según operador)

---

## 1. Clients

| Endpoint | `GET /client` |
|----------|---------------|
| **Filtros** | `active` (Boolean, EQ) · `firstName` (String, CONTAINS_IGNORE_CASE) · `lastName` (String, CONTAINS_IGNORE_CASE) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` (default 10) |
| **Archivos** | `lib/modules/clients/services/clients.service.ts` · `app/(app)/clients/hooks/useClientsTable.tsx` |

---

## 2. Assessments

| Endpoint | `GET /assessments` |
|----------|---------------------|
| **Filtros** | `createAt` (Date, GTE + LTE — rango) · `clientId` (UUID, EQ) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/assessments/services/assessments.service.ts` · `app/(app)/assessment/hooks/useAssessmentsTable.tsx` |

---

## 3. Service Log

| Endpoint | `GET /reports/service-log` |
|----------|---------------------------|
| **Filtros** | `clientId` (UUID, EQ) · `providerId` (UUID, EQ) · `initDate` (Date, GTE) · `endDate` (Date, LTE) |
| **Ordenamiento** | `initDate__DESC` (default) |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/service-log/services/service-log.service.ts` · `lib/modules/service-log/utils/filters.ts` · `app/(app)/service-log/hooks/useServiceLogTable.tsx` |

---

## 4. Case Supervision Log

| Endpoint | `GET /reports/case-supervision-log` |
|----------|--------------------------------------|
| **Filtros** | `clientId` (UUID, EQ) · `providerId` (UUID, EQ) · `monthYear` (String, GTE + LTE — formato MMyyyy) |
| **Ordenamiento** | `monthYear__DESC` (default) |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/case-supervision-log/services/case-supervision-log.service.ts` · `lib/modules/case-supervision-log/utils/filters.ts` · `app/(app)/case-supervision-log/hooks/useCaseSupervisionLogTable.tsx` |

---

## 5. Monthly Supervision

| Endpoint | `GET /reports/monthly-supervision` |
|----------|-------------------------------------|
| **Filtros** | `requestedReportMonthYear` (Number, GTE + LTE — formato yyyyMM) · `clientId` (UUID, EQ) · `providerId` (UUID, EQ) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/monthly-supervision/services/monthly-supervision.service.ts` · `app/(app)/monthly-supervisions/hooks/useMonthlySupervisionTable.tsx` |

---

## 6. Clinical Monthly

| Endpoint | `GET /reports/clinical-monthly` |
|----------|----------------------------------|
| **Filtros** | `startDate` (Date, GTE) · `endDate` (Date, LTE) · `clientId` (UUID, EQ) · `client.clientProviders.providerId` (UUID, EQ — relación anidada) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/clinical-monthly/services/clinical-monthly.service.ts` · `app/(app)/clinical-monthly/hooks/useClinicalMonthlyTable.tsx` |

---

## 7. Appointments

| Endpoint | `GET /appointment` |
|----------|---------------------|
| **Filtros** | `startDate` (Date, query param) · `endDate` (Date, query param) · `providerId` (String, query param) · `filters[]` (array DSL) |
| **Ordenamiento** | — |
| **Paginación** | No usa QueryModel (URLSearchParams directo) |
| **Archivos** | `lib/modules/schedules/services/appointments.service.ts` |
| **Nota** | Patrón legacy, no usa QueryModel |

---

## 8. Physicians

| Endpoint | `GET /physicians` |
|----------|---------------------|
| **Filtros** | `active` (Boolean, EQ) · `firstName` (String, CONTAINS_IGNORE_CASE) · `lastName` (String, CONTAINS_IGNORE_CASE) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/physicians/services/physicians.service.ts` · `app/(app)/my-company/physicians/hooks/usePhysiciansTable.tsx` |

---

## 9. Credentials

| Endpoint | `GET /credential` |
|----------|---------------------|
| **Filtros** | `name` (String, CONTAINS_IGNORE_CASE) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/credentials/services/credentials.service.ts` · `app/(app)/my-company/credentials/hooks/useCredentialsTable.tsx` |

---

## 10. Billing Codes

| Endpoint | `GET /billing-code` |
|----------|----------------------|
| **Filtros** | `active` (Boolean, EQ) · `typeCatalog.name` (String, RELATED_CONTAINS — relación) · `code` (String, CONTAINS_IGNORE_CASE) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/billing-codes/services/billing-codes.service.ts` · `app/(app)/my-company/billing/billing-codes/hooks/useBillingCodesTable.tsx` |

---

## 11. Roles

| Endpoint | `GET /roles` |
|----------|---------------|
| **Filtros** | Custom (via buildFilters) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/roles/services/roles.service.ts` · `app/(app)/my-company/roles/hooks/useRolesTable.tsx` |

---

## 12. Users (Member Users)

| Endpoint | `GET /member-users` |
|----------|----------------------|
| **Filtros** | Custom (via buildFilters) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/users/services/users.service.ts` · `app/(app)/users/hooks/useUsersTable.tsx` |

---

## 13. HR Documents

| Endpoint | `GET /document-config` |
|----------|-------------------------|
| **Filtros** | Custom filter strings |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/hr-documents/services/hr-documents.service.ts` · `app/(app)/hr-documents/hooks/useHRDocumentsTable.tsx` |

---

## 14. Clinical Documents

| Endpoint | `GET /document-config` |
|----------|-------------------------|
| **Filtros** | Custom filter strings |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/clinical-documents/services/clinical-documents.service.ts` · `app/(app)/clinical-documents/hooks/useClinicalDocumentsTable.tsx` |

---

## 15. Addresses

| Endpoint | `GET /company-address` |
|----------|-------------------------|
| **Filtros** | `active` (Boolean, EQ) · `nickName` (String, CONTAINS_IGNORE_CASE) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/addresses/services/addresses.service.ts` · `app/(app)/my-company/address/hooks/useAddressesTable.tsx` |

---

## 16. Applicants

| Endpoint | `GET /company/applicant` |
|----------|---------------------------|
| **Filtros** | Ninguno |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/applicants/services/applicants.service.ts` · `app/(app)/applicants/hooks/useApplicantsTable.tsx` |

---

## 17. Provider On File

| Endpoint | `GET /provider-on-file` |
|----------|--------------------------|
| **Filtros** | `firstName` (String, CONTAINS_IGNORE_CASE) · `lastName` (String, CONTAINS_IGNORE_CASE) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/provider-on-file/services/provider-on-file.service.ts` · `app/(app)/my-company/providers-on-file/hooks/useProvidersOnFileTable.tsx` |

---

## 18. Diagnosis Catalog

| Endpoint | `GET /diagnosis-code/catalog` |
|----------|-------------------------------|
| **Filtros** | Custom filter strings |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/diagnoses/services/diagnoses-catalog.service.ts` |

---

## 19. Payers

| Endpoint | `GET /payers` |
|----------|----------------|
| **Filtros** | Custom (via ListPayersQueryDto) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/payers/services/payers-api.service.ts` |

---

## 20. Client Service Plan

| Endpoint | `GET /client-service-plan` |
|----------|----------------------------|
| **Filtros** | `clientId` (UUID, EQ) · `active` (Boolean, EQ) |
| **Ordenamiento** | — |
| **Paginación** | `page: 0, pageSize: 10` (hardcoded) |
| **Archivos** | `lib/modules/client-service-plan/services/client-service-plan.service.ts` |

---

## 21. Company Service Plans

| Endpoint | `GET /service-plan` |
|----------|----------------------|
| **Filtros** | Custom (via buildFilters, search support) |
| **Ordenamiento** | — |
| **Paginación** | `page`, `pageSize` |
| **Archivos** | `lib/modules/service-plans/services/company-service-plans.service.ts` |

---

## Resumen de operadores usados

| Operador | Uso |
|----------|-----|
| `EQ` | Igualdad exacta (active, clientId, providerId) |
| `GTE` | Mayor o igual (fechas desde) |
| `LTE` | Menor o igual (fechas hasta) |
| `CONTAINS_IGNORE_CASE` | Búsqueda parcial de texto (nombres, códigos) |
| `RELATED_CONTAINS` | Búsqueda en campo de relación anidada (typeCatalog.name) |

## Resumen de prefijos de tipo

| Prefijo | Campos |
|---------|--------|
| `UUID_` | clientId, providerId |
| `Date_` | startDate, endDate, initDate, createAt |
| `Boolean_` | active |
| `String_` | firstName, lastName, name, code, monthYear |
| `Integer_` / `Number_` | requestedReportMonthYear |
