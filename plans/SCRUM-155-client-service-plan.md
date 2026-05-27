# SCRUM-155: Cliente Service Plan — Plan de Implementación

> **Jira:** SCRUM-155 | **Sprint:** 12-13 | **Estado:** EN CURSO
> **Objetivo:** Crear la configuración de Service Plan a nivel de cliente, comenzando con Recommendations.

---

## Contexto

Cada cliente tiene UN service plan que se clona automáticamente desde el SP de compañía al crear el cliente (`POST /client-service-plan/clone-to-client`). Este SP del cliente hereda categorías, items, data collection y charts del SP de compañía, pero permite configuración adicional específica del cliente: **Recommendations**, **Baselines** y **Objectives**.

La estructura del backend es **espejo** del SP de compañía:
- `client-service-plan` ↔ `service-plan`
- `client-service-plan-category-item` ↔ `service-plan-category-item`
- `client-service-plan-category/level` ↔ `service-plan-category/level`

---

## Fases de Implementación

### FASE 1: Infraestructura — Página de Configuración del Client Service Plan

**Objetivo:** Agregar acción "Configuration" en la tabla de clientes → página nueva que replica el patrón de `/my-company/service-plans/[id]/configuration/` pero para el SP del cliente.

---

#### Tarea 1.1: Obtener el clientServicePlanId del cliente

**Problema:** La tabla de clientes solo tiene `client.id`. Necesitamos el `clientServicePlanId` para navegar a la configuración.

**Solución:** Usar `GET /client-service-plan?filters=[{field:"clientId",value:"<clientId>"}]&page=0&pageSize=1` para obtener el SP del cliente. Esto se puede hacer:
- Opción A: Al cargar la página de configuración (recomendado, más simple)
- Opción B: Precargar en la tabla (más complejo, innecesario)

**→ Usar Opción A:** Navegar a `/clients/[clientId]/service-plan` y resolver el `clientServicePlanId` dentro de la página.

---

#### Tarea 1.2: Agregar botón "Configuration" en la tabla de clientes

**Archivo a modificar:** `/app/(app)/clients/hooks/useClientsTable.tsx`

**Cambios:**
1. Importar el ícono `Sliders` de `lucide-react` (mismo ícono que usa la config de SP de compañía)
2. Agregar un segundo botón en la columna `actions` (línea ~205), ANTES del botón Edit existente

**Código del nuevo botón** (insertar dentro del `<div className="flex justify-end gap-2">`, antes del botón Edit):

```tsx
<button
  onClick={() => router.push(`/clients/${client.id}/service-plan`)}
  className={cn(
    "group/config relative h-9 w-9",
    "flex items-center justify-center rounded-xl",
    "bg-gradient-to-b from-emerald-50 to-emerald-100/80",
    "border border-emerald-200/60 shadow-sm shadow-emerald-900/5",
    "hover:from-emerald-100 hover:to-emerald-200/90",
    "hover:border-emerald-300/80 hover:shadow-md hover:shadow-emerald-900/10",
    "hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2"
  )}
  title="Service Plan Configuration"
  aria-label="Service Plan Configuration"
>
  <Sliders className="w-4 h-4 text-emerald-600 group-hover/config:text-emerald-700 transition-colors duration-200" />
</button>
```

**Nota:** Usar color `emerald` para diferenciarlo del botón Edit (azul). El patrón de estilos es idéntico al existente, solo cambian los colores.

---

#### Tarea 1.3: Crear types para Client Service Plan

**Nuevo archivo:** `/lib/types/client-service-plan.types.ts`

```ts
export interface ClientServicePlan {
  id: string
  clientId: string
  servicePlanId: string
  name: string
  description: string
  startDate?: string
  endDate?: string
  active: boolean
  categories: string[]
}

export interface ClientServicePlanCategorySummary {
  id: string
  categoryId: string
  categoryName: string
  canEdit?: boolean
  totalItems: number
  hasDataCollection?: boolean
}

export interface ClientServicePlanCategoryMappedItem {
  id: string
  itemId: string
  itemName: string
  canEdit?: boolean
  description?: string
  active?: boolean
  order?: number
  hasDataCollection?: boolean
  hasCustomDataCollection?: boolean
}

// --- Recommendations Types ---

export interface RecommendationCatalogItem {
  id: string
  name: string
  group?: string  // usado por reinforcers y replacements que tienen sub-grupos
}

export interface RecommendationSelection {
  catalogItemId: string
  catalogItemName: string
  customText?: string  // para items con (________) donde el usuario escribe texto libre
}

export interface ItemRecommendations {
  strategies: string[]                          // IDs del catálogo strategy
  activitiesImplemented: RecommendationSelection[]  // con posible customText
  preventiveStrategies: RecommendationSelection[]   // con posible customText (pencil icon = puede agregar)
  replacements: string[]                        // IDs - solo visible si strategy incluye "Intervention"
  interventions: RecommendationSelection[]      // con posible customText - solo si strategy incluye "Intervention"
  reinforcers: string[]                         // IDs - solo visible si strategy incluye "Reinforcement"
}

// --- DTOs ---

export interface UpdateClientServicePlanDto {
  id: string
  clientId: string
  name: string
  startDate?: string
  endDate?: string
  description?: string
  active: boolean
  categories: string[]
}

export interface AssignItemToClientServicePlanCategoryDto {
  clientServicePlanCategoryId: string
  itemIds: string[]
}
```

**IMPORTANTE:** Los tipos `RecommendationSelection` e `ItemRecommendations` deberán ajustarse según la respuesta real del backend. Verificar la estructura exacta haciendo un GET al endpoint de items y viendo qué campos de recommendations devuelve.

---

#### Tarea 1.4: Crear service layer para Client Service Plan

**Nuevo archivo:** `/lib/modules/client-service-plan/services/client-service-plan.service.ts`

Replicar el patrón de `/lib/modules/service-plans/services/company-service-plans.service.ts` pero usando los endpoints `client-service-plan`:

```ts
import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"

// --- Client Service Plan CRUD ---

// GET /client-service-plan?filters=[...]&page=0&pageSize=1
export async function getClientServicePlanByClientId(clientId: string): Promise<ClientServicePlan | null>

// GET /client-service-plan/{id}
export async function getClientServicePlanById(id: string): Promise<ClientServicePlan | null>

// PUT /client-service-plan
export async function updateClientServicePlan(dto: UpdateClientServicePlanDto): Promise<void>

// --- Categories ---

// GET /client-service-plan/{clientServicePlanId}/category
export async function getClientServicePlanCategories(clientServicePlanId: string): Promise<ClientServicePlanCategorySummary[]>

// --- Category Items ---

// GET /client-service-plan-category-item/item-by-client-service-plan-category-id/{clientServicePlanCategoryId}
export async function getClientServicePlanCategoryItems(clientServicePlanCategoryId: string): Promise<ClientServicePlanCategoryMappedItem[]>

// POST /client-service-plan-category-item
export async function assignItemsToClientServicePlanCategory(dto: AssignItemToClientServicePlanCategoryDto): Promise<void>

// DELETE /client-service-plan-category-item/{id}
export async function deleteClientServicePlanCategoryItem(id: string): Promise<void>

// --- Item Catalog ---

// GET /client-service-plan/{clientServicePlanId}/item/catalog
export async function getClientServicePlanItemCatalog(clientServicePlanId: string, page: number, pageSize: number): Promise<{ items: ItemCatalogItem[], total: number }>

// --- Data Collection (Level) ---

// GET /client-service-plan-category/{clientServicePlanCategoryId}/level
export async function getClientCategoryDataCollection(clientServicePlanCategoryId: string): Promise<...>

// PUT /client-service-plan-category/level
export async function upsertClientCategoryDataCollection(dto: SyncClientServicePlanCategoryLevelsCommand): Promise<void>

// GET /client-service-plan-category-item/{clientServicePlanCategoryItemId}/level
export async function getClientItemDataCollection(clientServicePlanCategoryItemId: string): Promise<...>

// PUT /client-service-plan-category-item/level
export async function upsertClientItemDataCollection(dto: SyncClientServicePlanCategoryItemLevelsCommand): Promise<void>

// DELETE endpoints para levels...
```

**Patrón de normalización:** Copiar las funciones `normalizeServicePlan`, `normalizeCategorySummary`, etc. de `company-service-plans.service.ts` y adaptarlas. El backend probablemente devuelve la misma estructura, pero las funciones de normalización manejan variaciones en el formato de respuesta (snake_case, camelCase, wrapped/unwrapped).

---

#### Tarea 1.5: Crear hooks

**Nuevo directorio:** `/lib/modules/client-service-plan/hooks/`

**Archivos:**
1. `use-client-service-plan.ts` — Hook que recibe `clientId`, busca el SP del cliente con `getClientServicePlanByClientId(clientId)`, devuelve `{ clientServicePlan, isLoading, error }`
2. `use-client-service-plan-by-id.ts` — Hook que recibe `clientServicePlanId`, devuelve el SP por ID

---

#### Tarea 1.6: Crear la página de configuración

**Nuevo directorio y archivos:**

```
app/(app)/clients/[id]/service-plan/
├── page.tsx                              ← Página principal
├── hooks/
│   ├── useClientServicePlanConfiguration.ts  ← Replica useServicePlanConfiguration
│   ├── useClientServicePlanCategoryItems.ts  ← Replica useServicePlanCategoryItems
│   └── useDataCollectionDrawerController.ts  ← Reutilizar el existente (importar)
└── components/
    ├── ClientServicePlanHeader.tsx        ← Header con gradiente
    ├── ClientServicePlanSummaryCard.tsx   ← Card resumen del SP del cliente
    ├── CategoriesSidebar.tsx             ← Sidebar de categorías (puede reutilizar el existente con props)
    ├── CategoryItemsPanel.tsx            ← Panel de items (puede reutilizar)
    ├── MappedItemRow.tsx                 ← Fila de item mapeado
    ├── CreateItemInlineForm.tsx          ← Form inline para crear item
    └── AddItemsDrawer.tsx               ← Drawer para agregar items del catálogo
```

**PATRÓN:** La estructura es **idéntica** a `/app/(app)/my-company/service-plans/[id]/configuration/`. La diferencia principal es:

1. **page.tsx** — En lugar de recibir `params.id` como servicePlanId, recibe `params.id` como **clientId** y resuelve el `clientServicePlanId` internamente:

```tsx
"use client"
import { useParams } from "next/navigation"

export default function ClientServicePlanPage() {
  const params = useParams<{ id: string }>()  // id = clientId

  // Hook que primero obtiene el clientServicePlanId a partir del clientId
  const {
    clientServicePlan,
    categories,
    activeCategoryId,
    activeCategory,
    isLoading,
    error,
    // ... mismo patrón que useServicePlanConfiguration
  } = useClientServicePlanConfiguration(params.id)  // pasa clientId

  // ... resto idéntico al SP de compañía
}
```

2. **useClientServicePlanConfiguration.ts** — Igual a `useServicePlanConfiguration.ts` pero:
   - Recibe `clientId` en lugar de `servicePlanId`
   - Primero llama `getClientServicePlanByClientId(clientId)` para obtener el `clientServicePlanId`
   - Luego usa ese ID para cargar categorías: `getClientServicePlanCategories(clientServicePlanId)`

3. **Header** — Cambiar título a "Client Service Plan" con ícono y gradiente consistente
4. **SummaryCard** — Mostrar nombre del cliente + nombre del SP + status
5. **Sidebar + Items + Drawers** — Misma lógica, pero llamando a los servicios de `client-service-plan` en vez de `service-plan`

**Reutilización vs Duplicación:**
- Los componentes de compañía usan servicios específicos dentro de sus hooks. Es más limpio **duplicar la estructura** (como se hizo con data collection) y llamar a los servicios correctos, que hacer componentes genéricos con flags. Esto mantiene la independencia entre módulos.
- **SÍ reutilizar:** `DataCollectionDrawer` (el componente ya existente) — solo necesita recibir los servicios correctos como props o crear una versión que llame a los endpoints `client-service-plan-category/level`.

---

#### Tarea 1.7: Adaptar DataCollectionDrawer para Client SP

El `DataCollectionDrawer` existente en `/app/(app)/my-company/service-plans/components/data-collection/` llama internamente a servicios del SP de compañía. Hay dos opciones:

**Opción A (Recomendada): Crear un wrapper/versión para client SP**
- Crear `/app/(app)/clients/[id]/service-plan/components/ClientDataCollectionDrawer.tsx`
- Este wrapper usa el mismo formulario/UI pero llama a los endpoints `client-service-plan-category/level` y `client-service-plan-category-item/level`

**Opción B: Hacer el drawer genérico con prop `context: "company" | "client"`**
- Más trabajo de refactor, mayor riesgo de romper lo existente

**→ Usar Opción A** para evitar riesgo.

---

### FASE 2: Recommendations — Sección Colapsable dentro del Drawer de Data Collection

**Objetivo:** Agregar Recommendations como una **tercera sección colapsable** dentro del mismo drawer donde ya están Data Collection y Chart. El drawer existente usa `<Collapsible>` de Radix UI para cada sección y un `useState<"data" | "chart" | null>` para controlar cuál está abierta. Recommendations se integra con el mismo patrón.

**Arquitectura actual del drawer (DataCollectionForm.tsx):**
```
DrawerContent
└── DataCollectionForm (react-hook-form)
    ├── Header (Name, Category, Topography, Active — solo modo item)
    ├── Collapsible: "DATA COLLECTION"     ← sección existente
    │   └── Type selector, campos condicionales, LevelsTable
    ├── ChartCollapsibleSection: "CHART"   ← sección existente
    │   └── Tabs (General, X Axis, Y Axes, Datasets, Objectives)
    ├── 🆕 Collapsible: "RECOMMENDATIONS"  ← NUEVA sección a agregar
    │   └── Strategy, Activities, Preventive, condicionales...
    └── Bottom Bar (Cancel / Save)
```

**Cambio clave:** El `openSection` state pasa de `"data" | "chart" | null` a `"data" | "chart" | "recommendations" | null`.

**Save atómico:** Todas las secciones se guardan juntas en un solo `PUT`. Los datos de Recommendations se envían como parte del mismo payload que ya incluye Data Collection y Chart.

---

#### Tarea 2.1: Crear service para catálogos de Recommendations

**Nuevo archivo:** `/lib/modules/client-service-plan/services/recommendation-catalogs.service.ts`

```ts
import { serviceGet, servicePost, servicePut, serviceDelete } from "@/lib/services/baseService"

// --- Strategy ---
// GET /strategy/catalog — solo lectura, sin CRUD
export async function getStrategyCatalog(): Promise<RecommendationCatalogItem[]>

// --- Activities Implemented Prior to Occurrence ---
// GET /activities-implemented/catalog  (paginado)
// POST /activities-implemented         (crear nuevo — ícono del lápiz)
// PUT /activities-implemented           (editar)
// DELETE /activities-implemented/{id}   (eliminar)
export async function getActivitiesImplementedCatalog(page?, pageSize?): Promise<{ items: RecommendationCatalogItem[], total: number }>
export async function createActivityImplemented(name: string): Promise<void>
export async function updateActivityImplemented(id: string, name: string): Promise<void>
export async function deleteActivityImplemented(id: string): Promise<void>

// --- Preventive Strategies ---
// GET /preventive-strategy/catalog     (paginado)
// POST /preventive-strategy            (crear nuevo — ícono del lápiz)
// PUT /preventive-strategy             (editar)
// DELETE /preventive-strategy/{id}     (eliminar)
export async function getPreventiveStrategiesCatalog(page?, pageSize?): Promise<{ items: RecommendationCatalogItem[], total: number }>
export async function createPreventiveStrategy(name: string): Promise<void>
export async function updatePreventiveStrategy(id: string, name: string): Promise<void>
export async function deletePreventiveStrategy(id: string): Promise<void>

// --- Interventions (solo visible si Strategy = "Intervention") ---
// GET /intervention/catalog            (paginado)
// POST /intervention                   (crear nuevo — ícono del lápiz)
// PUT /intervention                    (editar)
// DELETE /intervention/{id}            (eliminar)
export async function getInterventionsCatalog(page?, pageSize?): Promise<{ items: RecommendationCatalogItem[], total: number }>
export async function createIntervention(name: string): Promise<void>
export async function updateIntervention(id: string, name: string): Promise<void>
export async function deleteIntervention(id: string): Promise<void>

// --- Reinforcers (solo visible si Strategy = "Reinforcement") ---
// GET /reinforcers/catalog             (paginado, tiene "group" field)
// POST /reinforcers                    (crear nuevo)
// PUT /reinforcers                     (editar)
// DELETE /reinforcers/{id}             (eliminar)
export async function getReinforcersCatalog(page?, pageSize?): Promise<{ items: RecommendationCatalogItem[], total: number }>
export async function createReinforcer(name: string, group: string): Promise<void>
export async function updateReinforcer(id: string, name: string, group: string): Promise<void>
export async function deleteReinforcer(id: string): Promise<void>

// --- Replacements (solo visible si Strategy = "Intervention") ---
// GET /replacement/catalog             (paginado, tiene sub-grupos)
export async function getReplacementsCatalog(page?, pageSize?): Promise<{ items: RecommendationCatalogItem[], total: number }>
// (No tiene POST/PUT/DELETE en el swagger, solo lectura)
```

---

#### Tarea 2.2: Crear hooks para catálogos

**Nuevo directorio:** `/lib/modules/client-service-plan/hooks/`

```
use-strategy-catalog.ts
use-activities-implemented-catalog.ts
use-preventive-strategies-catalog.ts
use-interventions-catalog.ts
use-reinforcers-catalog.ts
use-replacements-catalog.ts
```

Cada hook sigue el patrón estándar del proyecto:
```ts
export function useStrategyCatalog() {
  const [items, setItems] = useState<RecommendationCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { /* fetch */ }, [])

  return { items, isLoading, error, refetch }
}
```

---

#### Tarea 2.3: Componente MultiSelectWithSearch

**Nuevo archivo:** `/components/custom/MultiSelectWithSearch.tsx`

Componente reutilizable para los campos de selección múltiple de Recommendations.

**Props:**
```ts
interface MultiSelectWithSearchProps {
  label: string
  items: RecommendationCatalogItem[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  isLoading?: boolean
  grouped?: boolean              // true para reinforcers/replacements (usa item.group)
  allowCreate?: boolean          // true si tiene ícono de lápiz (✏️)
  onCreate?: (name: string) => Promise<void>
  fillInBlankItems?: Set<string> // IDs de items que tienen (________) y necesitan texto
  fillInBlankValues?: Record<string, string>  // { itemId: "texto ingresado" }
  onFillInBlankChange?: (itemId: string, text: string) => void
}
```

**Comportamiento:**
1. Input de búsqueda en la parte superior para filtrar items
2. Lista scrollable de checkboxes
3. Si `grouped=true`, agrupar por `item.group` con headers de grupo
4. Si `allowCreate=true`, mostrar ícono de lápiz que abre un mini-form inline para agregar un nuevo item al catálogo
5. Si un item seleccionado tiene `(________)` en su nombre, mostrar un `<input>` de texto al lado donde el usuario escribe el valor
6. Chips/tags de items seleccionados arriba del input de búsqueda

**Detección de fill-in-blank:** Un item requiere texto libre si su nombre contiene `________` (8+ underscores). Ejemplo: `"Sd presented (________)"`.

---

#### Tarea 2.4: Crear RecommendationsCollapsibleSection

**Nuevo archivo:** `/app/(app)/clients/[id]/service-plan/components/data-collection/RecommendationsCollapsibleSection.tsx`

Sigue el mismo patrón que `ChartCollapsibleSection`: un componente que recibe `control`, `open`, `onOpenChange` del react-hook-form padre, y renderiza su UI colapsable.

```tsx
interface RecommendationsCollapsibleSectionProps {
  control: Control<DataCollectionFormValues>
  setValue: UseFormSetValue<DataCollectionFormValues>
  getValues: UseFormGetValues<DataCollectionFormValues>
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Estructura interna de la sección colapsable:**

```
Collapsible: "RECOMMENDATIONS"
├── CollapsibleTrigger
│   ├── Title: "RECOMMENDATIONS" (uppercase, tracking-wider, slate-800)
│   ├── Badge: count de selections (ej: "5 selected")
│   └── ChevronDown (rotate-180 cuando abierto)
└── CollapsibleContent
    ├── Strategy (multi-select simple — solo 2 opciones: Intervention, Reinforcement)
    ├── Activities Implemented Prior to Occurrence ✏️ (MultiSelectWithSearch)
    ├── Preventive Strategies ✏️ (MultiSelectWithSearch)
    ├── ── Condicional: Strategy incluye "Intervention" ──
    │   ├── Replacements (MultiSelectWithSearch grouped)
    │   └── Interventions ✏️ (MultiSelectWithSearch)
    └── ── Condicional: Strategy incluye "Reinforcement" ──
        └── Reinforcers ✏️ (MultiSelectWithSearch grouped)
```

**Integración con react-hook-form:** Los campos de Recommendations se agregan al schema del formulario existente. El form ya maneja Data Collection + Chart; ahora se agregan campos de Recommendations al mismo `useForm`:

```ts
// Nuevos campos en DataCollectionFormValues:
{
  // ... campos existentes de DC y Chart ...
  recommendations: {
    strategyIds: string[]
    activitiesImplemented: Array<{ catalogItemId: string; customText?: string }>
    preventiveStrategies: Array<{ catalogItemId: string; customText?: string }>
    replacements: string[]              // solo si strategy incluye Intervention
    interventions: Array<{ catalogItemId: string; customText?: string }>  // solo si Intervention
    reinforcers: string[]               // solo si strategy incluye Reinforcement
  }
}
```

---

#### Tarea 2.5: Modificar DataCollectionForm para incluir Recommendations

**Archivo a modificar:** La versión CLIENT del `DataCollectionForm` (creada en Fase 1, Tarea 1.7).

**Cambios concretos:**

1. **State:** Cambiar `openSection` type de `"data" | "chart" | null` a `"data" | "chart" | "recommendations" | null`

2. **Agregar computed:**
```ts
const isRecommendationsOpen = openSection === "recommendations"
```

3. **Agregar la sección entre Chart y Bottom Bar** (línea ~750 del form, después de `ChartCollapsibleSection`):
```tsx
{/* --- Recommendations (collapsible) --- */}
<RecommendationsCollapsibleSection
  control={control}
  setValue={setValue}
  getValues={getValues}
  open={isRecommendationsOpen}
  onOpenChange={(next) => setOpenSection(next ? "recommendations" : null)}
/>
```

4. **Actualizar validación de errores** para incluir `hasRecommendationsSectionErrors(errors)` en la lógica de `onSubmit` error handler.

5. **Agregar defaultValues** para los campos de recommendations en el `useForm`.

**IMPORTANTE:** Estos cambios van en la versión CLIENT del form (`ClientDataCollectionDrawer`), NO en el form original de compañía. El SP de compañía NO tiene Recommendations.

---

#### Tarea 2.6: Actualizar schema de validación

**Archivo nuevo o extensión:** `/lib/schemas/client-data-collection-form.schema.ts`

Extender el schema existente `data-collection-form.schema.ts` para incluir validación de Recommendations:

```ts
const recommendationsSchema = z.object({
  strategyIds: z.array(z.string()),
  activitiesImplemented: z.array(z.object({
    catalogItemId: z.string(),
    customText: z.string().optional(),
  })),
  preventiveStrategies: z.array(z.object({
    catalogItemId: z.string(),
    customText: z.string().optional(),
  })),
  replacements: z.array(z.string()),
  interventions: z.array(z.object({
    catalogItemId: z.string(),
    customText: z.string().optional(),
  })),
  reinforcers: z.array(z.string()),
})
```

Agregar funciones helper:
```ts
export function hasRecommendationsSectionErrors(errors: FieldErrors): boolean
export function formatRecommendationsValidationAlert(errors: FieldErrors): AlertInfo
```

---

## Orden de Ejecución para Sonnet

### Paso 1: Types (Tarea 1.3)
Crear `/lib/types/client-service-plan.types.ts` con todos los tipos definidos arriba.

### Paso 2: Service Layer (Tarea 1.4 + 2.1)
Crear ambos archivos de servicio:
- `/lib/modules/client-service-plan/services/client-service-plan.service.ts`
- `/lib/modules/client-service-plan/services/recommendation-catalogs.service.ts`

**Clave:** Seguir exactamente el patrón de normalización de `company-service-plans.service.ts`. Las funciones `normalizeServicePlan`, `normalizeCategorySummary`, `normalizeMappedItem` deben adaptarse para manejar respuestas flexibles del backend (snake_case/camelCase, wrapped/unwrapped).

### Paso 3: Hooks base (Tarea 1.5 + 2.2)
Crear todos los hooks en `/lib/modules/client-service-plan/hooks/`.

### Paso 4: Botón en tabla de clientes (Tarea 1.2)
Modificar `useClientsTable.tsx` para agregar el botón de configuración con ícono `Sliders` color emerald.

### Paso 5: Página de configuración (Tarea 1.6)
Crear toda la estructura de `/app/(app)/clients/[id]/service-plan/`:
- `page.tsx` + hooks + components
- Replicar el patrón exacto de `/my-company/service-plans/[id]/configuration/`
- Diferencias: recibe `clientId`, resuelve `clientServicePlanId`, usa servicios de `client-service-plan`

### Paso 6: MultiSelectWithSearch component (Tarea 2.3)
Componente genérico reutilizable en `/components/custom/`.

### Paso 7: Client DataCollectionDrawer con Recommendations (Tarea 1.7 + 2.4 + 2.5)
Crear `ClientDataCollectionDrawer.tsx` que:
- Usa endpoints `client-service-plan-category/level` y `client-service-plan-category-item/level`
- Incluye la **tercera sección colapsable** `RecommendationsCollapsibleSection`
- Tiene form schema extendido con campos de Recommendations
- Save atómico: DC + Chart + Recommendations en un solo PUT

### Paso 8: Schema de validación (Tarea 2.6)
Crear/extender schema para incluir validación de Recommendations.

---

## Endpoints Backend — Resumen

### Client Service Plan (YA LISTOS)
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/client-service-plan?filters=...` | Buscar SP por clientId |
| GET | `/client-service-plan/{id}` | Obtener SP por ID |
| PUT | `/client-service-plan` | Actualizar SP |
| DELETE | `/client-service-plan/{id}` | Eliminar SP |
| POST | `/client-service-plan/clone-to-client` | Clonar SP de compañía a cliente |
| GET | `/client-service-plan/{id}/category` | Categorías del SP |
| GET | `/client-service-plan/{id}/item/catalog` | Catálogo de items |
| POST | `/client-service-plan-category-item` | Asignar items a categoría |
| GET | `/client-service-plan-category-item/item-by-client-service-plan-category-id/{id}` | Items de una categoría |
| DELETE | `/client-service-plan-category-item/{id}` | Eliminar item de categoría |
| GET | `/client-service-plan-category/{id}/level` | DC nivel categoría |
| PUT | `/client-service-plan-category/level` | Upsert DC categoría |
| GET | `/client-service-plan-category-item/{id}/level` | DC nivel item |
| PUT | `/client-service-plan-category-item/level` | Upsert DC item |
| DELETE | `/client-service-plan-category-level/{id}` | Eliminar level categoría |
| DELETE | `/client-service-plan-category-item-level/{id}` | Eliminar level item |

### Catálogos de Recommendations (YA LISTOS)
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/strategy/catalog` | Catálogo de estrategias |
| GET | `/activities-implemented/catalog` | Catálogo de actividades |
| POST | `/activities-implemented` | Crear actividad |
| PUT | `/activities-implemented` | Actualizar actividad |
| DELETE | `/activities-implemented/{id}` | Eliminar actividad |
| GET | `/preventive-strategy/catalog` | Catálogo preventivas |
| POST | `/preventive-strategy` | Crear preventiva |
| PUT | `/preventive-strategy` | Actualizar preventiva |
| DELETE | `/preventive-strategy/{id}` | Eliminar preventiva |
| GET | `/intervention/catalog` | Catálogo intervenciones |
| POST | `/intervention` | Crear intervención |
| PUT | `/intervention` | Actualizar intervención |
| DELETE | `/intervention/{id}` | Eliminar intervención |
| GET | `/reinforcers/catalog` | Catálogo reforzadores |
| POST | `/reinforcers` | Crear reforzador |
| PUT | `/reinforcers` | Actualizar reforzador |
| DELETE | `/reinforcers/{id}` | Eliminar reforzador |
| GET | `/replacement/catalog` | Catálogo reemplazos |

### Endpoints PENDIENTES de verificar con backend
- **¿Cómo se guardan las recommendations seleccionadas por item?** No encontré un endpoint tipo `PUT /client-service-plan-category-item/{id}/recommendations`. Es posible que:
  1. Las recommendations vengan como parte del response de `GET .../level` y se guarden en `PUT .../level`
  2. Existan endpoints no documentados en Swagger
  3. Haya que solicitar estos endpoints al equipo backend

  **→ ACCIÓN REQUERIDA:** Verificar con backend antes de implementar la Tarea 2.6 (save).

---

## Archivos que se Crean (Nuevos)

```
# --- Types ---
lib/types/client-service-plan.types.ts

# --- Services ---
lib/modules/client-service-plan/services/client-service-plan.service.ts
lib/modules/client-service-plan/services/recommendation-catalogs.service.ts

# --- Hooks (lib) ---
lib/modules/client-service-plan/hooks/use-client-service-plan.ts
lib/modules/client-service-plan/hooks/use-client-service-plan-by-id.ts
lib/modules/client-service-plan/hooks/use-strategy-catalog.ts
lib/modules/client-service-plan/hooks/use-activities-implemented-catalog.ts
lib/modules/client-service-plan/hooks/use-preventive-strategies-catalog.ts
lib/modules/client-service-plan/hooks/use-interventions-catalog.ts
lib/modules/client-service-plan/hooks/use-reinforcers-catalog.ts
lib/modules/client-service-plan/hooks/use-replacements-catalog.ts

# --- Página de configuración ---
app/(app)/clients/[id]/service-plan/page.tsx
app/(app)/clients/[id]/service-plan/hooks/useClientServicePlanConfiguration.ts
app/(app)/clients/[id]/service-plan/hooks/useClientServicePlanCategoryItems.ts
app/(app)/clients/[id]/service-plan/components/ClientServicePlanHeader.tsx
app/(app)/clients/[id]/service-plan/components/ClientServicePlanSummaryCard.tsx
app/(app)/clients/[id]/service-plan/components/CategoriesSidebar.tsx
app/(app)/clients/[id]/service-plan/components/CategoryItemsPanel.tsx
app/(app)/clients/[id]/service-plan/components/MappedItemRow.tsx
app/(app)/clients/[id]/service-plan/components/CreateItemInlineForm.tsx
app/(app)/clients/[id]/service-plan/components/AddItemsDrawer.tsx

# --- Drawer (DC + Chart + Recommendations) ---
app/(app)/clients/[id]/service-plan/components/ClientDataCollectionDrawer.tsx
app/(app)/clients/[id]/service-plan/components/data-collection/RecommendationsCollapsibleSection.tsx

# --- Schema ---
lib/schemas/client-data-collection-form.schema.ts

# --- Componente reutilizable ---
components/custom/MultiSelectWithSearch.tsx
```

## Archivos que se Modifican

```
app/(app)/clients/hooks/useClientsTable.tsx    ← Agregar botón "Configuration" (Sliders icon)
```

---

## Notas para el Desarrollador

1. **NO modificar** archivos del SP de compañía (`/my-company/service-plans/`). Son módulos independientes.
2. **Recommendations es una SECCIÓN colapsable** dentro del mismo drawer de Data Collection, al mismo nivel que DC y Chart. NO es un drawer separado. Usa `<Collapsible>` de Radix UI, mismo patrón que las secciones existentes.
3. **Save atómico:** DC + Chart + Recommendations se guardan juntos en un solo `PUT`. La sección Recommendations agrega sus campos al `DataCollectionFormValues` existente de react-hook-form.
4. **`openSection` state:** Extender de `"data" | "chart" | null` a `"data" | "chart" | "recommendations" | null`. Solo una sección abierta a la vez.
5. **Patrón de normalización:** Siempre usar funciones de normalización para parsear respuestas del backend (ver `company-service-plans.service.ts` como referencia). El backend puede devolver datos en formatos variados.
6. **Fill-in-blank:** Detectar items con `________` en el nombre. Cuando el usuario selecciona uno de estos, mostrar un input de texto adicional. Guardar como `{ catalogItemId, customText }`.
7. **Campos condicionales:** Los campos Replacements/Interventions solo se muestran si Strategy incluye "Intervention". Reinforcers solo si Strategy incluye "Reinforcement". Usar los nombres exactos del catálogo para la comparación. Ambos pueden estar seleccionados simultáneamente.
8. **Colores del botón:** Usar `emerald` para el botón de Configuration en la tabla de clientes (diferenciarlo del Edit azul).
9. **Catálogos con ✏️ (lápiz):** Activities Implemented, Preventive Strategies, Interventions y Reinforcers permiten crear nuevos items al catálogo global. Strategy y Replacements son solo lectura.
10. **Reinforcers tienen sub-grupos:** Social Reinforcers, Classroom Based Reinforcers (que a su vez contiene Activity, Material, Edible). Usar el campo `group` para agrupar.
11. **Replacements tienen sub-grupos:** Replacement/Acquisition Programs y Caregiver Programs. Usar el campo `group`.
12. **Solo en Client SP:** La sección Recommendations solo existe en el drawer del Client Service Plan, NO en el drawer del Company Service Plan. El SP de compañía sigue con solo Data Collection + Chart.
13. **Referencia de arquitectura del drawer:** Ver `DataCollectionForm.tsx` (772 líneas) → state `openSection`, `<Collapsible>` en línea ~362, `ChartCollapsibleSection` en línea ~750.
