# Contexto: Data Collection (Service Plan) · Gráfico (Cliente + Compañía) · Session Note 97153/97155/97156

> Documento de contexto generado el **2026-07-30** sobre el estado actual del código (branch `main`,
> último commit `74d6114 chart sesion note` + cambios sin commitear).
> Objetivo: tener una base clara para hacer ajustes sin volver a re-explorar el repo.

---

## 0. Mapa rápido

| Área | Compañía (plantilla) | Cliente (instancia real) | Session Note |
|---|---|---|---|
| Service Plan | `/my-company/service-plans` | `/clients/[id]/service-plan/[spId]` y `/clients/[id]/configuration` | — |
| Config Data Collection | `DataCollectionDrawer` + `DataCollectionForm` | `ClientDataCollectionDrawer` + `ClientDataCollectionForm` (SP) / `ClientDataCollectionModal` (configuration) | — |
| Config del gráfico | `ChartCollapsibleSection` (5 tabs) | mismo componente, embebido | — |
| Render del gráfico con datos | ❌ no existe | `datasheets/*Chart.tsx` (Frequency, Rate, Percentage, Duration) | `SessionItemChartPanel` |
| Captura de datos | ❌ | `DataCollectionContent` → datasheets | forms 97153 / 97156 |

**Regla mental:** la **compañía define la plantilla** (tipo de DC, niveles, apariencia del chart).
El **cliente hereda por clonado** (`POST /client-service-plan/clone-to-client`) y agrega lo clínico real:
**Baselines, Objectives (STO), Recommendations y los datos recolectados**.
El **gráfico solo se dibuja del lado cliente** (compañía únicamente configura cómo se verá).

---

## 1. Data Collection en el Service Plan

### 1.1 Modelo de configuración (`lib/types/data-collection.types.ts`)

```ts
DataCollectionConfig {
  id?, type (typeEventCatalogId), weeklyDailyValue, dailyValue,
  unitMeasurementCatalogId, levels[], intervalLength, unitOfTime,
  suggestedNumberOfRecordings, cumulative,
  chart?: ChartConfig,
  baselines?: DataCollectionBaselineData[],
  objectives?: DataCollectionObjectiveData[],
  recommendations?: RecommendationsConfig,
}
```

- `CategoryDataCollectionConfig` = config + `categoryId/categoryName`.
- `ItemDataCollectionConfig` = config + `itemId/itemName/topography/active/teachingProcedureId/isCustomOverride`.
- Enums en `service-plan-data-collection.enums.ts`: `ServicePlanValueType` (TOTAL/AVERAGE),
  `ServicePlanUnitOfTime` (SECONDS/MINUTES/HOURS/DAYS).

**Herencia categoría → item:** la config de categoría aplica a todos sus items;
un item puede sobreescribirla (`isCustomOverride`). En `DataCollectionContent` esto se resuelve así:
`effectiveTypeId = itemTypeId ?? catTypeId` y `dcConfig = itemDcConfig ?? catDcConfig`.
El item solo se consulta si su `dataCollection.typeEventCatalogId` **difiere** del de la categoría.

### 1.2 Endpoints

**Compañía** (`lib/modules/service-plans/services/data-collection.service.ts`)
- `GET/PUT /service-plan-category/level` (config de categoría)
- `GET/PUT /service-plan-category-item/level` (config de item)
- catálogos: `/type-event/catalog`, `/unit-measurement/catalog`, `/category/catalog`, `/item`

**Cliente** (`lib/modules/client-service-plan/services/client-data-collection.service.ts`)
- `GET /client-service-plan-category/{id}/level` · `PUT /client-service-plan-category/level`
- `GET /client-service-plan-category-item/{id}/level` · `PUT /client-service-plan-category-item/level`
- deletes: `/client-service-plan-category-level/{id}`, `/client-service-plan-category-item-level/{id}`,
  `/client-service-plan-category-baseline/{id}`, `/client-service-plan-category-item-baseline/{id}`,
  `/client-service-plan-category-objetive/{id}`, `/client-service-plan-category-item-objetive/{id}`
- `PATCH /client-service-plan-category-item-objetive/{id}` (solo `startDate`)
- `PUT /client-service-plan-category-item-baseline/values` (bulk de valores de baseline)

> ⚠️ El backend usa **`objetive`** (sin la “c”) y **`baseline`** en singular en los payloads.
> El front normaliza en `toApiObjectives` / `toApiBaselines`.

**Service Plan del cliente** (`client-service-plan.service.ts`)
- `GET /client-service-plan?filters=[{field:"clientId",...}]`, `GET/PUT /client-service-plan/{id}`
- `GET /client-service-plan/{spId}/category[?appointmentId=]`
- `GET /client-service-plan/{spId}/appointment/{appointmentId}/category` (variante alterna, poco usada)
- `GET /client-service-plan-category-item/item-by-client-service-plan-category-id/{catId}`
- `POST /client-service-plan/clone-to-client`

**Valores recolectados** (`client-data-collection-values.service.ts`)
- `GET /client-data-collection?clientServicePlanCategoryItemId=&startDate=&endDate=`
- `PUT /client-data-collection` → upsert `{ clientServicePlanCategoryItemId, appointmentId, date, value, environmentalChange }`

### 1.3 UI de configuración

**Compañía** — `my-company/service-plans/components/data-collection/`
`DataCollectionDrawer` → `DataCollectionForm` (748 líneas), con dos secciones colapsables
(`openSection: "data" | "chart"`): Data Collection y Chart. Sin baselines/objectives (son del cliente).

**Cliente, página SP** (`/clients/[id]/service-plan/[spId]`) — `ClientDataCollectionDrawer` →
`ClientDataCollectionForm` (793 líneas), secciones `"data" | "chart" | "recommendations"`.

**Cliente, página configuration** (`/clients/[id]/configuration`) — `ClientDataCollectionModal` (1104 líneas),
con **Tabs**: `Data Collection` · `Recommendations` · `Baselines` · `Objectives`
(las tres últimas solo en `mode === "item"`).

> 🐛 **Hallazgo:** en `ClientDataCollectionModal` existe `const chartContent = (...)` en la línea 899
> pero **nunca se usa** en `tabItems`. Es decir, en el modal de configuración del cliente
> **no hay tab de Chart** (sí lo hay en el drawer del SP). Código muerto / tab faltante — a decidir.

Regla ya establecida (memoria `feedback_type_inside_dc_tab`): el campo **Type** debe permanecer
como primer campo **dentro** del tab Data Collection, nunca fuera.

---

## 2. Configuración del gráfico (compartida cliente/compañía)

`lib/modules/service-plans/constants/chart.constants.ts` define todo el modelo visual:

```ts
ChartConfig {
  datasets: string[]              // ids del catálogo /datasets
  interval: ChartInterval          // SESSION | DAILY | WEEKLY | MONTHLY | QUARTERLY | YEARLY
  xAxis: { title, position TOP|BOTTOM, hideGrid }
  yAxis: { title, position LEFT|RIGHT, hideGrid, suggestedMin, suggestedMax }
  datasetConfigs: Record<datasetId, ChartDatasetVisualConfig>
  objectives: ChartObjectivesVisualConfig
}
```

- `ChartDatasetVisualConfig`: `title, axis, type (LINE|BAR), pointStyle, borderColor, backgroundColor,
  trendlineColor, spanGaps, showValues, unpin?, stacked?`
- Datasets conocidos por nombre: `Baseline`, `Total`, `Objectives`, `Tags`, `Sessions (count)`.
  Presets de color: **Baseline `#DC2626`**, **Total `#0F172A`**; default general `#037ECC`.
- `DEFAULT_CHART_CONFIG`: interval `WEEKLY`, yAxis “Number of occurrences”, suggestedMax 20,
  objectives con línea `DASHED`.
- `normalizeAxisTitle()` traduce “número de ocurrencias” → “Number of occurrences”.

**UI:** `my-company/service-plans/components/chart/ChartCollapsibleSection.tsx` con `ChartTabs`:
`General` · `X Axis` · `Y Axes` · `Objectives` · un tab por dataset (`ChartDatasetTab`).
Errores por tab vía `lib/schemas/chart-form-errors.ts`. Este mismo componente se reutiliza en el
cliente (con `as any` en `control/setValue/getValues` por el tipado de schema distinto).

---

## 3. Renderizado del gráfico con datos reales (solo cliente)

Todo vive en `app/(app)/clients/[id]/configuration/components/datasheets/`.

### 3.1 Piezas

| Archivo | Rol |
|---|---|
| `useChartDateRange.ts` | Rango y navegación: presets `1W/2W/1M/3M/6M`, interval, prev/next/today |
| `useChartData.ts` | Fusiona baselines + valores API + ediciones en grilla → puntos diarios → agrega |
| `aggregate-chart-data.ts` | Agregación WEEKLY/MONTHLY/YEARLY con TOTAL o AVERAGE |
| `FrequencyChart.tsx` | Gráfico principal (Recharts `ComposedChart`) — el más completo |
| `RateChart` / `PercentageChart` / `DurationChart` | Variantes por tipo de DC |
| `ChartDateRangeToolbar.tsx` | Toolbar de rango/interval |
| `*Datasheet.tsx` + `use*Datasheet.ts` | Tabla de captura por tipo |
| `OnsiteCollectionGrid.tsx` | Contador en vivo (método On-site) |

### 3.2 Lógica clave de `FrequencyChart`

- **Fase Baseline vs Treatment:** `treatmentStartDate` = `startDate` del **primer STO** (objetivo).
  Toda fecha **anterior** a ese día se pinta como baseline (línea roja `baselineValue`);
  desde ese día en adelante es treatment (línea azul `occurrences`).
- **Marcadores:** línea vertical negra “Treatment”; líneas grises por inicio/fin de cada STO;
  `ReferenceArea` con etiqueta `STO#n`; línea horizontal punteada verde del objetivo
  (`objectives[0].valueSmartCriteria`).
- **Environmental changes:** cada entrada con nota dibuja una línea vertical punteada teal + tooltip.
- **Eje Y:** rango dinámico `max(suggestedMax, dataMax)` con step 2/5/10/20 según magnitud.
- **Trend footer:** regresión lineal (`linearRegression`) → Increasing (rojo) / Decreasing (verde) /
  Stable (ámbar) + slope/intercept. Solo cuenta puntos de treatment (≥2).
- **Scroll horizontal** cuando hay >60 puntos diarios (>30 agregados).

### 3.3 Flujo de datos en `useChartData`

Prioridad por fecha: **edición en grilla > valor API (`/client-data-collection`) > baseline**.
En fase treatment la edición solo gana si `occurrences > 0`.

---

## 4. El gráfico dentro de la Session Note (`SessionItemChartPanel`)

Archivo: `app/(app)/session-note/components/SessionItemChartPanel.tsx` (525 líneas, commit `74d6114`).
Usado por **97153** (`SessionNoteForm.tsx:256`) y **97156** (`SessionNote97156Form.tsx:248`).

### 4.1 Comportamiento

- Se renderiza **al lado de cada CategoryCard** en un grid de 2 columnas.
- **Modo compacto** (por defecto): mini `ComposedChart` de 120px con dos líneas
  (baseline `#DC2626` / treatment `#037ECC`), tabs de items abajo y punto verde en items con valor.
- **Modo fullscreen** (`Maximize2`, salir con `Esc`): reutiliza `ChartDateRangeToolbar` + `FrequencyChart`
  completo, con toda la lógica de STO/objetivo/env-changes.
- **Live badge** verde pulsante cuando el item tiene valor en el formulario.
- El item activo se sincroniza en ambos sentidos: click/focus en el input del `CategoryCard`
  ↔ tabs del panel (`activeChartItems[categoryId]`).

### 4.2 Rango del gráfico

`useChartDateRange("2W", firstBaselineDate)` — se ancla en la **fecha del primer baseline** y
`computeOptimalPreset` sube el preset automáticamente (1W→6M) para que el rango cubra baseline→hoy.

### 4.3 Persistencia — ⚠️ punto importante

El valor del item se puede guardar por **dos caminos distintos**:

1. **Guardado de la nota** → `PUT /appointment/note` (o `/97156`) con `dataCollectionItems[]`.
2. **Botón “Save to Chart”** del panel → `PUT /client-data-collection` directo
   (`upsertClientDataCollectionValue`), usando `appointmentId` + fecha del `serviceDetails.date`.

El botón aparece solo si `hasPendingChanges` (valor o env-change distintos al registro guardado
para esa fecha). Tras guardar hace `refetch()` y muestra estado “saved” 2s.
**Riesgo a revisar:** dos fuentes de verdad para el mismo dato; si el backend no deduplica por
(`item`, `fecha`, `appointment`) puede haber inconsistencias o doble registro.

---

## 5. Session Notes por billing code

### 5.1 Ruteo (`app/(app)/session-note/page.tsx`)

Query params: `appointmentId`, `clientId`, `billingCode`.
Sin `appointmentId` → tabla (`SessionNotesTable`). Con él → `SessionNoteFormView`:

```
billingCode.includes("97156") → SessionNote97156FormView
billingCode.includes("97155") → SessionNote97155FormView
else                          → SessionNote97153FormView   (el "código 53")
```

Los tres comparten `FormViewShell` (header, PDF, lock/unlock) y `useNoteStatusHandler`.

### 5.2 Estados de nota (`deriveNoteStatusInfo`, `useNoteStatus.ts`)

`active` (editable) · `read` (solo data collection + firmas) · `close` · `lock` (no guarda).
En `read` el payload se envía **recortado**: solo `dataCollectionItems` + firmas.

### 5.2.1 Caregiver firmante (`clientCaregiverId`) — 2026-08-10

Los tres formularios (97153/97155/97156) tienen en la sección **Signatures**, celda Caregiver,
un `FloatingSelect` "Caregiver Name" con los caregivers **activos** del cliente
(`useCaregiversByClient(resolvedClientId)`, etiqueta "Nombre (Relación)"). El `clientId` se
resuelve desde la URL o, si falta, vía `getAppointmentById(appointmentId).clientId` (los tres
hooks tienen el fallback).

Contrato backend:
- Los `PUT` de nota aceptan `clientCaregiverId`; es **requerido** cuando se envía
  `caregiverSignatureImage` o `caregiverSignatureChecked: true` (400 si falta,
  422 si el caregiver no pertenece al cliente). El front valida esto en `handleSubmit`
  (error `clientCaregiverId`, "Select the caregiver who signed") **fuera** del gate
  `status !== "read"`, porque las firmas viajan también en `read`.
- Los `GET` devuelven `clientCaregiver: { id, fullName, relationshipId, relationshipName } | null`;
  se sincroniza al estado y se re-envía en cada save. Si el firmante persistido ya no está
  activo, igual se agrega a las opciones del select para que se siga mostrando.
- `caregiverSignatureChecked: false` borra firma + firmante en backend; notas históricas pueden
  venir con `clientCaregiver: null`.

El payload manda `clientCaregiverId: clientCaregiverId || null` junto a los campos de firma
(fuera del spread `isReadOnly`).

### 5.3 97153 — nota base (`SessionNoteForm.tsx` + `useSessionNoteForm.ts`)

Secciones: Service Details · Teaching Method, Modality & Participants · Session Details ·
**Goals & Programs (data collection + gráfico)** · Interventions (antecedent/consequence) ·
Session Summary · Signatures.
Endpoints: `GET /appointment/{id}/note`, `PUT /appointment/note`.
Catálogos: teaching-method, modality, participants, antecedent/consequence intervention.

### 5.4 97155 — supervisión (`SessionNote97155Form.tsx`)

Secciones propias: Face-to-face Protocol Observation · Protocol Adjustments · QHP Implementation ·
Supervision — Active Direction. **No lleva gráfico ni data collection.**
Endpoints: `GET /appointment/{id}/note/97155`, `PUT /appointment/note/97155`.

### 5.5 97156 — caregiver training (NUEVO, sin commitear)

Archivos nuevos:
```
app/(app)/session-note/components/SessionNote97156Form.tsx      (610)
app/(app)/session-note/hooks/useSessionNote97156Form.ts         (318)
lib/types/appointment-note-97156.types.ts
lib/modules/appointment-notes/services/appointment-note-97156.service.ts
lib/modules/appointment-notes/services/97156-intervention-catalog.service.ts
lib/modules/appointment-notes/hooks/use-appointment-note-97156.ts
lib/modules/appointment-notes/hooks/use-appointment-note-97156-mutation.ts
lib/modules/appointment-notes/hooks/use-97156-intervention-catalog.ts
```

**Endpoints:** `GET /appointment/{appointmentId}/note/97156` · `PUT /appointment/note/97156` ·
`GET /intervention/catalog` (las 5 intervenciones fijas).

**Secciones del formulario (en orden):**
1. Recipient + Provider (cards de contexto)
2. Service Details (date, place of service, time in/out, hours, billing codes)
3. Modality & Participants — `FloatingSelect` modality + `MultiSelectWithSearch` participants
   (Client fijo vía `CLIENT_PARTICIPANT_ID`, `lockedIds`)
4. Session Details — Reason Caregiver Not Present, Medical Concerns (default `"N/A"`), switch Crisis Involved
5. **Goals & Programs** — `CategoryCard` (value + environmental change por item) + `SessionItemChartPanel`
6. **Session Participants** — caregivers del cliente (`useCaregiversByClient(clientId)`, solo `status` activo,
   se muestra “Nombre (Relación)”) + switch **Client Present**
7. **Interventions** — checkboxes con el catálogo `/intervention/catalog`
8. **Session Summary** — `Goals` (textarea) + `Summary` (textarea)
9. Signatures — provider + caregiver (firma dibujada o checkmark según `useCheckmarkSignature`)

**Diferencias vs 97153:** tiene `caregiverIds` + `clientPresent` + `goals` + `interventionIds`
(lista única, no antecedent/consequence); **no** tiene teaching method.

**Validación (`handleSubmit`)** — bloquea si falta: modality, ≥1 participante, reason caregiver not present,
medical concerns, ≥1 caregiver, ≥1 intervención, goals, sessionSummary, **y todo item de data collection
debe tener `value`**. Hace scroll+focus al primer error (`[data-field]` / `[data-item-value]`)
usando el contenedor `#main-scroll`.

**`clientId`**: idealmente la URL lleva `?clientId=`; si falta, los hooks lo resuelven con
`getAppointmentById(appointmentId).clientId` (fallback presente en 97153, 97155 y 97156).

---

## 6. Cambios sin commitear (estado actual del working tree)

### 6.1 Editar Service Plan del cliente (nuevo)

`app/(app)/clients/[id]/service-plan/components/EditClientServicePlanModal.tsx` (nuevo, 349 líneas)
- Form con `react-hook-form` + `zod`: name, startDate, endDate, active (switch), categories (picker).
  Valida `endDate >= startDate` y ≥1 categoría.
- Al abrir hace `GET /client-service-plan/{id}` para refrescar; si falla usa el plan en memoria.
- Reutiliza `ServicePlanCategoriesPicker` y `useServicePlanCategoriesCatalog` (crear/editar/borrar categorías).
- Guarda con `updateClientServicePlan` (`PUT /client-service-plan/{id}`).

Conectado desde:
- `CategoriesSidebar.tsx` — nuevo botón lápiz azul junto al título “Categories” (`onEditServicePlan?`).
- `useClientServicePlanConfiguration.ts` — nuevo estado `isEditModalOpen/openEditModal/closeEditModal/handleServicePlanUpdated`
  (este último recarga plan + categorías).
- Montado tanto en `/service-plan/[spId]/page.tsx` como en `configuration/ServicePlanConfigView.tsx`,
  ambos calculando `categoryLabels` (id → nombre) con `useMemo`.

### 6.2 Session Note 97156

Ver §5.5. En `page.tsx` se agregó el branch `is97156` y el `SessionNote97156FormView` completo.

---

## 7. Puntos abiertos / candidatos a ajuste

1. **`ClientDataCollectionModal`: `chartContent` definido pero no usado** (línea 899) → falta el tab Chart
   o hay que borrar el código muerto.
2. **`useClientServicePlanConfiguration`**: el `useEffect` de carga inicial depende solo de `[spId]`,
   no de `appointmentId`. Si el `appointmentId` cambia sin remount, las categorías no se re-filtran.
3. **`SessionItemChartPanel` → `ItemChartView`**: los `useMemo` de `treatmentStart` y `miniData` están
   **dentro del `if (compact)`** → viola las Rules of Hooks. Hoy no rompe porque `compact` es fijo por
   instancia, pero es frágil y lo marcará el linter.
4. **Doble persistencia del valor de data collection** (nota vs “Save to Chart”) — ver §4.3.
5. **Ruteo por `includes()`** del billing code: un código tipo `97156-XP` entra por el mismo branch.
   Verificar si los códigos XP de supervisión deben ir a otro formulario.
6. **97156 exige valor en TODOS los items** de todas las categorías para poder guardar; con categorías
   grandes puede ser bloqueante. Confirmar con Miriam si debe ser obligatorio.
7. **Modalidad de fecha en el chart de la nota**: se usa `serviceDetails.date` como clave del día.
   Si el backend devuelve un formato distinto a `YYYY-MM-DD` o ISO, `parsedDateKey` queda `null`
   y el botón “Save to Chart” nunca aparece.
8. **97155 sin data collection**: confirmar si debe llevar gráfico también.

---

## 8. Referencias cruzadas

- `docs/design-prompt-datasheets.md` — sistema visual y layout de datasheets/on-site (brand `#037ECC`).
- `plans/SCRUM-155-client-service-plan.md` — plan original del Client Service Plan.
- Memorias: `project_data_collection_hu`, `project_data_collection_methods`,
  `project_appointment_datacollection`, `feedback_type_inside_dc_tab`, `feedback_no_auto_assign`.
