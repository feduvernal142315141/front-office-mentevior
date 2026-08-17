# Assessment — Plan de implementación (Front)

> Fecha: 2026-08-17
> Contrato backend: entregado 2026-08-16 (entidad `Assessment` + `GradeCatalog` +
> `AssessmentConductedCatalog` + category-items por cliente)
> Módulo análogo: Clinical Monthly (`lib/modules/clinical-monthly` + `app/(app)/clinical-monthly`)
> Página actual: `app/(app)/assessment/page.tsx` es un placeholder "Coming Soon"

## ✅ Estado — actualizado 2026-08-17 con el contrato completo de backend

Listado, creación y edición construidos y **ajustados a las respuestas de backend**
(contrato completo con colecciones hijas del 2026-08-17); `tsc` y `next build` pasan.

Respuestas incorporadas:

| Pregunta | Respuesta de backend | Implementación |
| --- | --- | --- |
| Q1 · Obligatoriedad | **Sólo `clientId` es requerido.** Por fila: `observations[].date`, `billingCodes[].billingCodeId`, `proposedSchedule[].credentialId`; unidades/horas no negativas; `timeInit < timeEnd` si vienen ambos | `useAssessmentForm.ts` (`validate`); enums/horas vacíos viajan como `null` |
| Q2 · JSON del detalle | Publicado: hijas con `id` de fila + nombres resueltos (`assessmentConductedName`, `clientServicePlanCategoryItemName`, `billingCode`, `credential`) | `normalizeAssessmentDetail` ajustado |
| Q3 · Body del PUT | `PUT /assessments` (sin id en ruta), **`id` en el body**, mismo shape que el POST; reemplaza colecciones por soft-delete + insert | `assessments.service.ts` |
| Q4 · Filtros del listado | Sin confirmar — sigue solo `clientId` | `useAssessmentsTable.tsx` |
| Q7/Q8 · DELETE / PDF | Siguen sin existir | — |

**Colecciones nuevas** (contrato 2026-08-17): `billingCodes` (código del catálogo de la
compañía + units period/week + `settings` JSON string, convención front `{location,notes}`),
`proposedSchedule` (credencial + JSON string con exactamente Monday…Sunday numéricos,
serializado en `utils/assessment-json-fields.ts`) y `abcData` (antecedent/behavior/
consequence). Secciones `BillingCodesSection`, `ProposedScheduleSection` y `AbcDataSection`,
con catálogos `useBillingCodes` / `useCredentials` existentes.

### Revisión del contrato (commands/queries, segundo ajuste 2026-08-17)

- **Eliminados**: `schoolType`, `instructionRatio`, `educationalSupport` y
  `schoolReleaseInformation` (campos y enums removidos de tipos, constantes, form y
  columna School de la tabla).
- **Agregados**: los 12 campos `background*` (sección Background: summary full-width +
  11 textareas, lista en `ASSESSMENT_BACKGROUND_FIELDS`) y la colección `providerFiles`
  (sección Providers: type/name/contact). ⚠️ La propiedad del contacto es
  **`contactIformation`** [sic] — typo definido así en el código Java; el normalizador
  acepta también `contactInformation` por si backend lo corrige.
- **Validación de backend temporalmente desactivada** (nada requerido a nivel validator);
  el front conserva sus validaciones (clientId, timeInit<timeEnd, fecha por observación,
  ids por fila, no-negativos) porque son las reglas comentadas para reactivación.
- El PDF deriva `School Information / Hours` de `timeInit`/`timeEnd` (no hay `schoolHours`).

Pendiente (fase 5): probar el flujo completo contra el backend real.

## 0. Qué es

Formulario clínico grande por **cliente**: información escolar, vivienda/familia, historial
médico (con snapshot del diagnóstico primario), medicamentos actuales, observaciones,
assessments conducted (checklist de catálogo) y una evaluación por **item del Service Plan
activo** (intensidad + función hipotetizada).

CRUD: `POST /assessments`, `PUT /assessments/{id}`, `GET /assessments` (paginado estándar),
`GET /assessments/{id}`. **No hay DELETE en el contrato** (ver preguntas §6).

La ruta `/assessment` ya está cableada en nav y permisos (`PermissionModule.ASSESSMENT`,
`use-filtered-nav-items.ts:22`) — solo hay que reemplazar el placeholder.

## 1. Decisiones de diseño

1. **Calcar Clinical Monthly**: listado (`page.tsx` + tabla con filtros) → `create/page.tsx` →
   `[id]/edit/page.tsx`, con un solo `AssessmentForm` compartido create/edit, como
   `ClinicalMonthlyForm`.
2. **Enums como constantes con label map** (no catálogos): `SchoolType`, `SchoolSetting`,
   `InstructionRatio` (labels `1:5`…`1:30`), `HousingType`, `AssessmentIntensityKey`,
   `HypothesizedFunction`. Se envía/recibe el nombre Java exacto.
3. **Snapshot del diagnóstico primario**: el front NO lo manda. En create se muestra
   informativo (el dx actual del cliente, vía módulo `diagnoses`/perfil) y en edit se muestra
   `medicalHistoryPrimaryDiagnosisName` persistido, siempre solo lectura.
4. **El PUT reemplaza colecciones hijas completas** (soft-delete + insert): el form siempre
   manda los arrays completos, nunca deltas. Sin ids de fila en el payload de update
   (verificar §6-Q3).
5. **Category items**: el nuevo `GET /client-service-plan/client/{clientId}/category-items`
   alimenta la sección; si devuelve `[]` (cliente sin SP activo), la sección muestra empty
   state y no bloquea el guardado.

## 2. Arquitectura

```
lib/types/assessment.types.ts                  ← entidad, list item, detail, DTOs, enums
lib/constants/assessment.constants.ts          ← label maps de los 6 enums

lib/modules/assessments/
  services/assessments.service.ts              ← CRUD (patrón clinical-monthly.service.ts)
  services/assessment-catalogs.service.ts      ← /grade/catalog, /assessment-conducted/catalog
  services/client-category-items.service.ts    ← /client-service-plan/client/{id}/category-items
  hooks/use-assessments.ts                     ← listado paginado (QueryModel + buildFilters)
  hooks/use-assessment-by-id.ts
  hooks/use-save-assessment.ts                 ← create + update con toasts
  hooks/use-assessment-catalogs.ts             ← grade + conducted (patrón use-relationship-catalog)
  hooks/use-client-category-items.ts           ← se refetch al cambiar el cliente

app/(app)/assessment/
  page.tsx                                     ← reemplaza el "Coming Soon": AssessmentsTable
  create/page.tsx
  [id]/edit/page.tsx
  components/AssessmentsTable.tsx
  components/AssessmentForm.tsx                ← orquesta las secciones
  components/sections/SchoolSection.tsx
  components/sections/HousingSection.tsx
  components/sections/MedicalHistorySection.tsx
  components/sections/MedicationsSection.tsx   ← filas dinámicas
  components/sections/ObservationsSection.tsx  ← filas dinámicas
  components/sections/AssessmentConductedSection.tsx  ← checklist del catálogo
  components/sections/CategoryItemsSection.tsx ← items agrupados por categoría
  hooks/useAssessmentsTable.tsx                ← patrón useClinicalMonthlyTable
  hooks/useAssessmentForm.ts                   ← estado, validación, payload
```

Reutilizables existentes: `useClientsByLoggedUser` (select de cliente),
`useRelationshipCatalog` (`/relationship/catalog`, para housing members), `CustomTable`,
`FloatingInput/FloatingSelect`, `MultiSelectWithSearch`, `PremiumSwitch`,
`PremiumDatePicker`, `buildFilters`/`getQueryString`.

## 3. Modelo (lib/types/assessment.types.ts)

- `AssessmentListItem`: contrato del response item del listado (`gradeName`,
  `medicalHistoryPrimaryDiagnosisName`, `createAt`, `active`).
- `AssessmentDetail`: detalle con hijas resueltas — `housingMembers[]` (con
  `relationshipName`), `currentMedications[]`, `observations[]`, `assessmentConductedList[]`
  (con datos del catálogo), `categoriesItems[]` (con datos del item del SP). **El contrato no
  muestra el JSON del detalle**: tipar defensivamente y normalizar en el service (§6-Q2).
- `SaveAssessmentDto`: el request del POST tal cual el ejemplo; el PUT igual (¿sin
  `clientId`? — §6-Q3).
- Sub-tipos: `AssessmentMedicationInput { name, dosage, frequency, details }`,
  `AssessmentObservationInput { date, setting, summary }`,
  `AssessmentCategoryItemInput { clientServicePlanCategoryItemId, intensityKey,
  intensityDescription, hypothesizedFunction }`.
- Catálogos: `GradeCatalogItem` y `AssessmentConductedCatalogItem`
  `{ id, code, name, sortOrder }`.
- `ClientCategoryWithItems { id, name, items: { id, name }[] }`.

## 4. Fases

### Fase 1 — Tipos, constantes y servicios
Todo el §3 + los tres services + hooks de datos. Catálogos: pedir con `pageSize` grande
explícito (el default documentado es `0`, ver §6-Q5) y ordenar por `sortOrder` en el front
como red de seguridad. Sin UI todavía; `tsc` como gate.

### Fase 2 — Listado
`AssessmentsTable` + `useAssessmentsTable` calcados de Clinical Monthly:
- Columnas: Client, School (name + type), Grade (`gradeName`), Housing, Primary Diagnosis,
  Created (`createAt`), Status (`active`), Actions (editar).
- Filtros: cliente (`clientId__EQ__UUID_…`) y rango de `createAt` si el backend lo soporta
  (§6-Q4); empezar solo con cliente si no está confirmado.
- Botón "New assessment" → `/assessment/create`.

### Fase 3 — Formulario de creación
`AssessmentForm` + `useAssessmentForm`, secciones en el orden del contrato:
1. **Client** — select requerido (deshabilitado en edit). Al elegirlo se cargan sus
   category-items y se muestra su dx primario actual (informativo).
2. **School** — name, type (enum), timeInit/timeEnd (inputs de hora → `HH:mm:ss`), grade
   (catálogo), setting (enum), instruction ratio (enum con labels `1:N`), address,
   educational support, switch `schoolReleaseInformation`.
3. **Housing & Family** — type (enum), rooms/bathrooms (números ≥ 0), members
   (multi-select del relationship catalog → `housingMemberRelationshipCatalogIds`),
   housing information (textarea).
4. **Medical History** — dx primario solo lectura + textareas (other diagnosis,
   morbidities, allergies, type of birth, special characteristic, additional info).
   Default `"N/A"` en los campos que el ejemplo manda como `"N/A"` (mismo criterio que
   Medical Concerns en session notes).
5. **Current Medications** — filas dinámicas (add/remove): name, dosage, frequency, details.
6. **Observations** — filas dinámicas: date (PremiumDatePicker → `yyyy-MM-dd`), setting,
   summary.
7. **Assessment Conducted** — checklist con las 16 opciones del catálogo →
   `assessmentConductedCatalogIds`.
8. **Categories & Items** — agrupado por categoría del SP activo; por item: Intensity
   (MILD/MODERATE/HIGH), Intensity description, Hypothesized Function
   (ESCAPE/ATTENTION/SENSORY/TANGIBLE). Solo los items tocados van al payload (un item sin
   intensidad ni función no se manda — confirmar obligatoriedad, §6-Q6).

Validación con scroll-al-error (`[data-field]` + `#main-scroll`, patrón 97156). Guardar →
toast + redirect al listado.

### Fase 4 — Edición
`[id]/edit/page.tsx`: `use-assessment-by-id` → precarga (normalizando hijas a los inputs del
form), cliente bloqueado, dx = snapshot persistido. Guardar con `PUT` mandando colecciones
completas.

### Fase 5 — Pulido
- Reemplazo definitivo del placeholder, breadcrumbs/título consistentes con el resto.
- Estados vacíos (sin SP activo, sin catálogos), loading skeletons de la tabla.
- `tsc` + build + prueba manual contra backend (crear, editar, listar, filtrar).

## 5. Estimación de esfuerzo relativo

La fase 3 es ~60% del trabajo (8 secciones, 2 colecciones dinámicas, 1 sección dependiente
del cliente). Fases 1-2 son mecánicas sobre patrones ya resueltos. Fase 4 es mapeo
detail→form, cuyo costo real depende del JSON del detalle (§6-Q2).

## 6. Preguntas para backend (ordenadas por bloqueo)

| # | Pregunta | Bloquea |
| --- | --- | --- |
| Q1 | ¿Qué campos del POST son **opcionales/nullables**? El ejemplo trae todo lleno. ¿Se puede crear un assessment parcial (p. ej. sin school o sin observations)? Define qué valida el front. | Fase 3 |
| Q2 | **JSON del `GET /assessments/{id}`**: el contrato lo describe pero no lo muestra. Nombres exactos de las hijas y sus campos (¿`observations[].date` como `yyyy-MM-dd`?, ¿`categoriesItems[]` trae `categoryName`/`itemName`?). | Fase 4 |
| Q3 | ¿El `PUT` acepta el mismo body que el POST? ¿Con o sin `clientId`? ¿Se puede cambiar el cliente? | Fase 4 |
| Q4 | ¿Qué campos soporta `filters` en `GET /assessments`? (mínimo `clientId`; ¿`createAt` por rango?) | Fase 2 (filtros) |
| Q5 | En los dos catálogos el `pageSize` por defecto documentado es **`0`** — ¿`0` = "todos"? Si no, el front pedirá `pageSize=200` explícito. | Fase 1 (workaround listo) |
| Q6 | En `categoriesItems[]`, ¿los tres campos del item son obligatorios si el item se manda? ¿Es válido mandar el array vacío? | Fase 3 |
| Q7 | ¿Habrá `DELETE /assessments/{id}` o desactivar? El listado trae `active`, pero no hay endpoint. Mientras tanto la tabla no ofrece borrar. | No (se omite) |
| Q8 | ¿Habrá **PDF** del assessment (como Clinical Monthly / session notes)? Cambia si el listado necesita botón de preview y una ruta proxy. | No (se agrega después) |
| Q9 | Typo en semilla del catálogo: **"Collage"** → "College". Front muestra el `name` tal cual llegue. | No (cosmético) |
| Q10 | `timeInit`/`timeEnd` llegan como `HH:mm:ss` — ¿el GET los devuelve igual? El input del front será de hora (`HH:mm`) y se agrega `:00` al enviar. | Fase 3/4 |

## 7. Relación con lo existente

- `template-documents/assessment` (permiso `assessment_configuration`) es otra cosa: plantillas
  de documento. Este plan no lo toca.
- El endpoint de category-items es hermano de los de `client-service-plan` ya consumidos
  (`docs/contexto-datacollection-grafico-sessionnote.md` §1.2), pero devuelve una forma
  reducida `{id, name, items[]}` — service propio, no reutilizar los tipos grandes del SP.
