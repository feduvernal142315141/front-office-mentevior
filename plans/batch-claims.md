# Plan: Módulo Batch Claims (Billed Claims)

Fecha: 2026-08-13. HU de creación/edición de `BatchClaim` + preview CMS-1500 + descarga 837P.

## 1. Contexto backend (3 docs)

El flujo completo que expone el backend:

1. **Crear lote** — `POST /batch-claims` con `{ payerPlanId, reference, comments, appointmentIds[] }` → devuelve el UUID. No crea `Claim`s; solo la cabecera + selección de appointments.
2. **Elegibles** — `GET /batch-claims/appointments?payerPlanId&initDate&endDate[&clientId]` → appointments facturables (nota LOCK + firma caregiver + provider con firma + insurance activo con ese payer).
3. **Listar** — `GET /batch-claims` (contrato estándar filters/orders/page/pageSize). Campos: reference, payerPlanName, payerName, comments, createAt, active.
4. **Detalle** — `GET /batch-claims/{id}` → cabecera + appointments agrupados por `clientId + priorAuthorizationId + insuranceId`, con authNumber, memberNumber, placeOfService, billingCode, primaryDiagnosis, units, rate, submitAmount (rate/submitAmount pueden ser `null` si no hay tarifa vigente).
5. **Editar** — `PUT /batch-claims/{id}`; `appointmentIds` **reemplaza** la selección completa.
6. **Preview CMS-1500** — `GET /batch-claims/{id}/preview` y `GET /batch-claims/{id}/clients/{clientId}/preview` → `{ fileBase64 }` (PDF). Una página CMS-1500 por grupo cliente/auth/insurance, 6 service lines por página.
7. **837P** — `GET /batch-claims/{id}/837p` → `{ fileName: "837P_{uuid}.dat", fileBase64 }` (X12 005010X222A1, US-ASCII). Genera el archivo, NO lo sube al clearing house. Requiere `edi_submitter_id`/`edi_receiver_id` configurados en `company_clearing_house_config` (422 si faltan). 422 también para pólizas de dependiente (solo Self/Subscriber/Patient).

Permisos: todo bajo `billed_claims` — READ (list/get/elegibles/preview/837p), CREATE, EDIT.

## 2. Patrones del repo a reutilizar

- **Punto de montaje**: `/my-company/billing/billed-claims` ya existe como placeholder "Coming Soon"; el permiso `PermissionModule.BILLED_CLAIMS` ya está en `permissions-new.ts`, `permissions-map.ts`, `use-filtered-nav-items.ts` y `ProtectedRoute.tsx`. Solo hay que reemplazar el stub.
- **Patrón payer** ("varios formularios → un objeto"): una página larga con secciones colapsables (Card + ChevronDown + useState), un único `useForm` + zod (`mode: "onBlur"`), sub-componentes que reciben `form` por props, payload único armado en el submit. Scroll-to-error con `data-form-field` + `scrollToFirstError`. Aquí el form es más simple (3 campos escalares), así que la parte compleja no es RHF sino la **tabla de selección de appointments**, que vivirá en estado propio (`Set<string>` de ids) fuera de RHF — análogo a cómo payer maneja `planRates` fuera de RHF y lo fusiona en el submit.
- **Servicios**: clase + contrato como `payers-api.service.ts` es opcional; basta el patrón funcional de `appointment-note.service.ts` (serviceGet/Post/Put + `getApiErrorMessage` + parse defensivo). Hooks con toast de sonner (`@/lib/compat/sonner`) que devuelven `null` en error.
- **PDF preview**: `createPdfProxyRoute` (`lib/server/pdf-proxy.ts`) + `DocumentViewer`; el backend ya responde `{ fileBase64 }` como el resto de reports. Rutas nuevas:
  - `app/api/reports/batch-claim/preview/[fileName]/route.ts` → `/batch-claims/{id}/preview`
  - `app/api/reports/batch-claim-client/preview/[fileName]/route.ts` → `/batch-claims/{id}/clients/{clientId}/preview` (el proxy acepta query params extra; revisar firma de `buildUpstreamUrl` para pasar `clientId`)
- **837P**: no es PDF; descarga client-side — decodificar `fileBase64` (`atob` → `Uint8Array` → `Blob` `application/octet-stream`) y `<a download={fileName}>`.
- **Tabla + paginación**: replicar `PayersTable`/`SessionNotesTable` (server pagination con filters/orders).
- **Permisos**: usar `usePermission()` directo con `PermissionModule.BILLED_CLAIMS` (no hace falta el fallback especial de payers, que existe por un tema legacy del JWT).

## 3. Referencia de la industria (ABA)

Los sistemas ABA (CentralReach, AlohaABA, Theralytics, TherapyPM) siguen el mismo flujo que este diseño: sesión documentada y aprobada → charge/billing entry → vista de claims con filtros (payer, rango, cliente, estado) → selección + bundling por cliente/autorización → batch submit al clearing house (837P) con opción de CMS-1500 imprimible. Puntos de UX comunes que vale copiar:

- Filtros arriba (payer/plan, rango de fechas, cliente) y refresco de la lista de elegibles al cambiar.
- Agrupación visual por cliente con subtotales (units, monto) y select-all por grupo.
- Totales del lote siempre visibles (N appointments, N clientes, $ total estimado).
- Señalar por qué algo no es facturable (aquí lo resuelve el backend devolviendo solo elegibles; opcional a futuro: vista de "no elegibles + motivo").

## 4. Arquitectura propuesta

### Tipos — `lib/types/batch-claim.types.ts`
```ts
BatchClaimSummary        // fila del listado (GET /batch-claims)
BatchClaim               // detalle: cabecera + appointments: BatchClaimClientGroup[]
BatchClaimClientGroup    // clientId, clientName, payerName, priorAuthorizationNumber, memberNumber, appointmentDetails[]
BatchClaimAppointmentDetail // appointmentId, date, placeOfService, billingCode, primaryDiagnosis, units, rate|null, submitAmount|null
EligibleAppointment      // GET /batch-claims/appointments
CreateBatchClaimPayload  // { payerPlanId, reference, comments, appointmentIds }
UpdateBatchClaimPayload  // igual + id en URL
BatchClaim837PResult     // { fileName, fileBase64 }
```

### Servicios — `lib/modules/batch-claims/services/batch-claims.service.ts`
- `getBatchClaims(params)` — paginado estándar.
- `getBatchClaimById(id)` — parse defensivo (entity/data/raw).
- `getEligibleAppointments({ payerPlanId, initDate, endDate, clientId? })`.
- `createBatchClaim(payload)` / `updateBatchClaim(id, payload)`.
- `download837P(id)` — devuelve `{ fileName, fileBase64 }`.
- `getBatchClaimPdfPreviewUrl(id)` / `getBatchClaimClientPdfPreviewUrl(id, clientId)` — URLs same-origin al proxy.

### Hooks — `lib/modules/batch-claims/hooks/`
`use-batch-claims`, `use-batch-claim-by-id`, `use-eligible-appointments`, `use-batch-claim-mutation` (create+update), `use-download-837p`.

Catálogo de payer plans para el select: los planes vienen embebidos en `GET /payers/{id}` (payerPlans[]). Para el selector "Payer → Plan" reutilizar `usePayers` (lista) y al elegir payer cargar sus planes con `getPayersService().getById`. Alternativa si el backend expone un catálogo plano de planes: usarlo (confirmar con backend).

### Páginas — `app/(app)/my-company/billing/billed-claims/`
```
page.tsx                       — tabla de batch claims (reemplaza el stub)
create/page.tsx                — creación
[id]/page.tsx                  — detalle (grupos por cliente, preview, 837P)
[id]/edit/page.tsx             — edición (misma UI que create, precargada)
components/BatchClaimsTable.tsx
components/BatchClaimForm.tsx          — compartido create/edit (cabecera + selección)
components/EligibleAppointmentsPicker.tsx — filtros + tabla agrupada con checkboxes
components/BatchClaimDetailView.tsx    — grupos cliente/auth/insurance con montos
hooks/useBatchClaimForm.ts
```

### Flujo de la pantalla de creación
1. **Sección "Batch Details"**: Payer (FloatingSelect searchable) → Plan (dependiente), Reference (requerido), Comments (FloatingTextarea). RHF + zod.
2. **Sección "Select Appointments"**: habilitada al elegir plan. Filtros: rango de fechas (requerido para consultar) + cliente opcional. Botón/auto-fetch de elegibles → tabla agrupada por cliente con checkbox por fila y por grupo. Estado `selectedIds: Set<string>` fuera de RHF.
3. **Footer fijo** (FormBottomBar): contador "N appointments · N clients" + Create. Validación manual: ≥1 seleccionado (scroll al picker si no), reference y plan del schema zod.
4. Cambiar de plan limpia la selección (los elegibles dependen del payer). Cambiar rango de fechas conserva los seleccionados que sigan dentro del nuevo resultado y descarta el resto (con aviso).

### Flujo del detalle
- Cabecera (reference, payer/plan, fecha, comments, badge active).
- Cards por grupo cliente (como el response del GET): tabla de appointmentDetails con date, POS, billing code, dx, units, rate, submitAmount; subtotal por grupo y total del batch. `rate: null` se pinta como "—" con warning "No applicable rate".
- Acciones: **Preview CMS-1500** (batch completo → DocumentViewer), **Preview por cliente** (botón en cada card), **Download 837P** (maneja 422 mostrando el detalle del error del backend: falta config EDI, dependiente no soportado, etc.), **Edit** (si permiso EDIT).

### Flujo de edición
- Carga `GET /batch-claims/{id}`; precarga payerPlan/reference/comments y `selectedIds` desde los grupos.
- El rango de fechas inicial se deriva de min/max de las fechas de los appointments seleccionados (el backend no persiste el rango).
- Los seleccionados actuales se marcan aunque el fetch de elegibles no los devuelva (p.ej. su nota cambió de estado): se listan en una sección "Currently selected" para poder des-seleccionarlos. PUT manda la lista completa (reemplazo total).

## 5. Fases sugeridas

1. **Fase 1 — Listado + tipos + servicios**: reemplazar stub por tabla paginada, tipos y service completo.
2. **Fase 2 — Creación**: form + picker de elegibles + POST.
3. **Fase 3 — Detalle**: vista agrupada con montos + preview CMS-1500 (proxy routes) + 837P download.
4. **Fase 4 — Edición**: reuso del form con precarga + PUT.

## 6. Cambio de contrato 2026-08-14: selección por Service Log

El backend cambió la unidad de selección: `BatchClaim` ya no guarda `appointmentIds` sino
`serviceLogIds`. Los appointments para CMS-1500/837P se derivan por
`BatchClaim → BatchClaimServiceLog → SupervisionLog → … → Appointment`. Los 3 endpoints de
salida (preview batch/cliente, 837p) NO cambian de contrato.

Resumen de cambios de API:
- `POST /batch-claims` y `PUT /batch-claims/{id}`: body con `serviceLogIds` (reemplazo total en PUT).
- `GET /batch-claims/appointments` → **`GET /batch-claims/service-logs`** (mismos query params);
  devuelve service logs con `providerName`, `initDate`/`endDate` (timestamps ISO) y sus
  `appointments[]` anidados.
- `GET /batch-claims/{id}`: agrega `serviceLogIds[]`; `appointments` (grupos por cliente) se
  mantiene pero derivado.
- Validación nueva clave: un service log activo no puede pertenecer a otro BatchClaim activo
  (create rechaza; update permite conservar los propios).

### Plan de adaptación del front

1. **Tipos** (`lib/types/batch-claim.types.ts`)
   - `BatchClaimPayload.appointmentIds` → `serviceLogIds`.
   - Nuevo `EligibleServiceLog { id, clientId, clientName, providerId, providerName, initDate,
     endDate, appointments: EligibleServiceLogAppointment[] }`. El appointment anidado usa
     `appointmentId` (ya no `id`) y pierde `clientId/clientName` (viven en el padre).
   - `BatchClaim` agrega `serviceLogIds: string[]`.
   - Eliminar `EligibleAppointment`/`EligibleAppointmentsQuery` o renombrarlos al nuevo shape.

2. **Service** (`batch-claims.service.ts`)
   - `getEligibleAppointments` → `getEligibleServiceLogs` apuntando a `/batch-claims/service-logs`;
     parse anidado; normalizar `initDate/endDate` ISO → `yyyy-MM-dd` (recorte, como hace
     `service-log.service.ts`).
   - `create/update`: renombrar campo del payload.
   - `getBatchClaimById`: parsear `serviceLogIds`.

3. **Hooks** — `use-eligible-appointments` → `use-eligible-service-logs` (misma mecánica
   fetch-bajo-demanda). En `useBatchClaimForm`, `selectedIds` pasa a contener **service log ids**;
   los totales (appointments/units) se calculan sumando los `appointments[]` de los SL
   seleccionados.

4. **Picker** (`EligibleAppointmentsPicker` → `EligibleServiceLogsPicker`)
   - Se mantiene la agrupación visual por cliente, pero el **checkbox va por service log**:
     fila con provider, período (initDate–endDate), N appointments y unidades totales.
   - Cada fila es expandible (chevron) para ver sus appointments en solo-lectura: fecha, horario,
     billing code (etiqueta resuelta con el catálogo, igual que hoy), unidades. No hay checkbox
     por appointment: la selección es todo-o-nada por service log (así lo modela el backend).
   - Select-all por cliente se mantiene (marca todos los SL del cliente).

5. **Edición**
   - Precarga de selección directa desde `serviceLogIds` del GET (ya no se deriva de appointments).
   - El rango del período se sigue derivando de min/max de las fechas de los appointments
     derivados (el GET no trae las fechas de los SL).
   - **Huérfanos** (SL seleccionados que la búsqueda vigente no devuelve): resolver sus datos con
     `getServiceLogById` (`/reports/service-log/{id}`, ya existe en
     `lib/modules/service-log/services/service-log.service.ts`, devuelve initDate/endDate/cliente)
     para pintar la fila "Currently selected — outside this search". Fallback: fila mínima solo
     con el id si ese GET falla.
   - Los snapshots por appointment (`SelectedAppointmentSnapshot`) se reemplazan por snapshots
     por service log.

6. **Errores** — el 400/422 de "service log ya pertenece a otro batch activo" llega por
   `getApiErrorMessage` al toast; verificar que el mensaje del backend sea legible. Opcional
   futuro: marcar en el picker los SL ya tomados por otro batch (hoy el backend no lo indica en
   el response de elegibles — pedirlo si Miriam lo quiere ver antes de fallar el submit).

7. **Detalle** — sin cambios funcionales (el response de grupos/preview/837P es igual). Opcional:
   tile "Service Logs" con `serviceLogIds.length` junto a Clients/Appointments/Units.

Orden sugerido: tipos → service → hooks → picker → edit → detalle. Sin migraciones de UI fuera
del picker; las rutas proxy y la descarga 837P no se tocan.

## 7. Preguntas abiertas / riesgos

1. **Selector de plan**: ¿existe (o puede existir) un endpoint de catálogo de payer plans de la compañía? Hoy habría que componerlo con `GET /payers` + `GET /payers/{id}`. (Preguntar a backend.)
2. **Rango de fechas en edit**: el backend no lo guarda; se deriva de los appointments. Confirmar que es aceptable.
3. **`GET /batch-claims/appointments` devuelve poca data por fila** (no trae billing code label, ni provider name, ni montos). Confirmar si el picker debe mostrar solo fecha/hora/cliente/unidades o si backend puede enriquecer el response (billingCode display, providerName, note status).
4. **422 del 837P por dependientes**: decidir si se muestra un aviso preventivo en el detalle cuando algún insurance del batch tiene relationship ≠ Self.
5. **Estado del batch**: el modelo solo tiene `active`; no hay estados tipo Draft/Submitted todavía (los `Claim` reales vienen en un paso posterior según el doc). La tabla no debe inventar estados.
