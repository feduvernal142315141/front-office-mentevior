# Plan: Evaluación Automática de Objetivos (STO) — Backend

## Contexto

Actualmente el estatus de los STOs se calcula solo en el frontend basándose en la presencia de `startDate` y `endDate`. No existe lógica que evalúe las ocurrencias registradas contra el criterio SMART para determinar si un objetivo fue cumplido (mastered). El requerimiento pide que esta evaluación sea automática al registrar nueva data.

**Decisión: Backend** — El backend externo debe manejar esta lógica porque:
- Tiene acceso directo al histórico completo de ocurrencias sin roundtrips
- Es la única fuente de verdad para el estado de los objetivos
- Evita race conditions si múltiples usuarios registran data simultáneamente
- El frontend no debería tener que fetchear semanas/meses de histórico para evaluar

---

## Endpoints involucrados

| Endpoint | Método | Uso actual |
|----------|--------|------------|
| `/client-data-collection` | PUT | Guarda una ocurrencia (value + appointmentId + itemId) |
| `/client-service-plan-category-item/level` | PUT | Guarda config completa del item (DC, baselines, objectives, chart) |
| `/client-service-plan-category-item/level` | GET | Retorna config del item incluyendo `objetive[]` |

---

## Cambios requeridos en el Backend

### 1. Trigger: Después de cada `PUT /client-data-collection`

Cuando se guarda un nuevo valor de ocurrencias, el backend debe ejecutar la evaluación automática del STO activo para ese item.

**Flujo:**
```
PUT /client-data-collection (guardar ocurrencia)
  → Guardar el value normalmente
  → Obtener el itemId del registro
  → Cargar los objectives del item (ordenados por startDate)
  → Encontrar el STO con estatus "in_progress" (startDate <= hoy AND endDate vacío)
  → Si existe STO in_progress:
      → Ejecutar evaluación de masterización
      → Si se cumple el criterio → actualizar STO
```

### 2. Lógica de evaluación de masterización

**Inputs del STO activo:**
- `operatorSmartCriteria`: operador de comparación (LTE, LT, GTE, GT, EQ)
- `valueSmartCriteria`: valor target (ej: 56)
- `periodSmartCriteriaCatalogId`: periodo de evaluación (ej: "week")
- `valueDuration`: cantidad de periodos consecutivos requeridos (ej: 4)
- `periodDurationCatalogId`: unidad del duration (ej: "week")
- `startDate`: desde cuándo evaluar

**Algoritmo:**
```
1. Resolver periodSmartCriteriaCatalogId a nombre ("day", "week", "month")
2. Resolver periodDurationCatalogId a nombre ("day", "week", "month")
3. Obtener todas las ocurrencias del item desde startDate hasta hoy
4. Agrupar ocurrencias por periodo (day/week/month) según periodSmartCriteria
5. Para cada periodo, calcular el total de ocurrencias
6. Evaluar cada periodo contra el criterio:
   - LTE: total <= valueSmartCriteria
   - LT:  total < valueSmartCriteria
   - GTE: total >= valueSmartCriteria
   - GT:  total > valueSmartCriteria
   - EQ:  total == valueSmartCriteria
7. Contar periodos CONSECUTIVOS (desde el más reciente hacia atrás) que cumplen
8. Si consecutivos >= valueDuration → STO MASTERED
```

**Ejemplo concreto:**
```
STO: <= 56 ocurrencias por semana, durante 4 semanas consecutivas

Semana 1 (jun 2-8):   45 ocurrencias → 45 <= 56 ✅
Semana 2 (jun 9-15):  50 ocurrencias → 50 <= 56 ✅
Semana 3 (jun 16-22): 56 ocurrencias → 56 <= 56 ✅
Semana 4 (jun 23-29): 30 ocurrencias → 30 <= 56 ✅
→ 4 semanas consecutivas cumplidas → MASTERED
```

**Caso de fallo intermedio:**
```
Semana 1: 45 ✅
Semana 2: 60 ❌  ← rompe la racha
Semana 3: 50 ✅
Semana 4: 30 ✅
→ Solo 2 consecutivas (semanas 3-4) → NO mastered, seguir evaluando
```

### 3. Acciones al masterizar un STO

Cuando la evaluación determina que el STO se cumple:

```
1. SET endDate del STO actual = último día del último periodo evaluado
   (ej: si la semana 4 fue jun 23-29, endDate = 2026-06-29)

2. Buscar el SIGUIENTE STO en la secuencia (ordenado por índice/orden de creación)
   - Siguiente STO = primer objective sin startDate O con startDate > hoy y sin endDate

3. SET startDate del siguiente STO = día siguiente al endDate del STO masterizado
   (ej: startDate = 2026-06-30)

4. Persistir ambos cambios en la tabla de objectives
```

### 4. Nuevo endpoint sugerido (opcional pero recomendado)

Para no tener que re-enviar toda la config del item solo para actualizar un objective:

```
PATCH /client-service-plan-category-item-objetive/{objectiveId}
Body: {
  endDate?: string        // Para marcar como mastered
  startDate?: string      // Para activar siguiente STO
}
```

Si no se crea este endpoint, el backend puede actualizar directamente en su DB después de evaluar, sin necesidad de pasar por el PUT del level completo.

---

## Cambios requeridos en el Frontend (mínimos)

### 1. Sin cambios en la lógica de guardado

El frontend sigue llamando `PUT /client-data-collection` normalmente. El backend hace la evaluación internamente.

### 2. Refrescar objectives después de guardar ocurrencias

En `FrequencyDatasheet.tsx`, después de guardar DC values exitosamente, recargar los items para reflejar cambios de estatus.

**Archivo:** `app/(app)/clients/[id]/configuration/components/datasheets/FrequencyDatasheet.tsx`

En `handleSaveDcValues`, después del `await dcValues.refetch()`, necesitamos recargar la data del item para obtener los objectives actualizados (el backend pudo haber masterizado un STO).

### 3. Visualización en el Chart (frontend con data existente del GET)

El chart debe reflejar visualmente el ciclo de vida de los STOs. **Toda la data necesaria ya viene en el GET** del item (`objetive[]` con `startDate` y `endDate`), no se requieren campos nuevos del backend.

#### 3.1 Phase lines y labels de STOs mastered

Cuando un STO tiene `endDate` (mastered), el chart debe mostrar:
- **Línea vertical punteada** en el `startDate` y en el `endDate` del STO
- **Label "STO#1", "STO#2"** centrado entre ambas líneas (en el rango donde se cumplió)
- Esto crea fases visibles en el chart separando baseline → STO#1 → STO#2 → STO#3

```
Ejemplo visual:
  Baseline  |  STO#1   |   STO#2   |        STO#3 (activo)
  ·····•····|····•·····|·····•·····|·····•·····•·····•····→
         startDate1  endDate1/   endDate2/
                     startDate2  startDate3
```

#### 3.2 Badge del STO activo (in_progress)

- Arriba del chart, mostrar el nombre completo del STO que está in_progress
- Ejemplo: `"STO#3: Aaliyah will reduce Mouthing to less or equal to 44 occurrences per week for 4 consecutive weeks."`
- Se identifica como: primer objective con `startDate <= hoy` y sin `endDate`

#### 3.3 Caso "Mastery Criteria" (sin STOs individuales)

Cuando el item tiene un solo objective genérico (no numerado como STO#1, STO#2...):
- Mostrar solo el label "Mastery Criteria: {nombre del objective}" arriba del chart
- No se muestran phase lines de STOs cumplidos porque no hay secuencia
- Las phase lines siguen mostrándose para baseline/treatment si aplica

#### 3.4 De dónde sale cada elemento

| Elemento visual | Campo del objective | Cálculo |
|---|---|---|
| Posición de phase line izquierda | `startDate` | Mapear fecha al eje X |
| Posición de phase line derecha | `endDate` | Mapear fecha al eje X |
| Label "STO#N" entre líneas | índice del objective en el array | Centrar entre startDate y endDate |
| Badge del STO activo | `name` | Primer obj con startDate <= hoy y sin endDate |
| Estatus mastered | `endDate` tiene valor | — |
| Estatus in_progress | `startDate <= hoy` AND `endDate` vacío | — |
| Estatus not_started | `startDate > hoy` OR sin startDate | — |

### 4. Feedback visual al usuario

Cuando un STO cambia a "mastered" automáticamente, mostrar un toast de notificación:
- "STO #1 has been mastered! STO #2 is now in progress."

---

## Consideraciones de edge cases

1. **Periodos incompletos**: Si la semana actual no ha terminado, no se evalúa (solo periodos completos)
2. **Sin data en un periodo**: Un periodo sin ocurrencias cuenta como 0 ocurrencias (puede cumplir o no según el operador)
3. **Último STO**: Si el STO masterizado es el último, no hay siguiente STO para activar
4. **Múltiples saves rápidos**: El backend debe ser idempotente — si ya está mastered, no re-evaluar
5. **Periodos de duración mixtos**: `periodSmartCriteriaCatalogId` (period de evaluación) y `periodDurationCatalogId` (period de duración) pueden ser diferentes. Ejemplo: "cumplir criterio diario durante 4 semanas" = evaluar ocurrencias por día, pero la racha se mide en semanas

---

## Modelo de datos actual (referencia)

### Objective (como llega del API)
```typescript
interface ApiObjective {
  id?: string
  name: string
  startDate: string                    // ISO date — cuándo inicia el STO
  estimatedEndDate: string             // ISO date — fecha estimada de fin
  endDate: string                      // ISO date — SE SETEA AL MASTERIZAR
  operatorSmartCriteria: string        // "GT" | "GTE" | "EQ" | "LT" | "LTE"
  valueSmartCriteria: number           // Valor target (ej: 56)
  periodSmartCriteriaCatalogId: string // UUID del periodo (day/week/month)
  valueDuration: number                // Cantidad de periodos consecutivos
  periodDurationCatalogId: string      // UUID del periodo de duración
}
```

### Data Collection Value (ocurrencia individual)
```typescript
interface ClientDataCollectionRecord {
  id: string
  appointmentId: string
  clientServicePlanCategoryItemId: string
  value: number                        // Cantidad de ocurrencias
  date: string                         // YYYY-MM-DD
  appointmentStatusId?: string
  appointmentStatusName?: string
}
```

### Cómo se determina el estatus actualmente (solo frontend)
```typescript
// endDate tiene valor     → "mastered"
// startDate <= hoy        → "in_progress"
// startDate > hoy o vacío → "not_started"
```

---

## Resumen de responsabilidades

| Componente | Responsabilidad |
|-----------|----------------|
| **Backend** (`PUT /client-data-collection`) | Trigger de evaluación al guardar ocurrencia |
| **Backend** (lógica interna) | Agrupar ocurrencias por periodo, evaluar criterio SMART, contar consecutivos |
| **Backend** (DB) | Actualizar `endDate` del STO mastered, `startDate` del siguiente STO |
| **Backend** (GET item) | Devolver `objetive[]` con `startDate` y `endDate` correctos (ya lo hace) |
| **Frontend** (`FrequencyDatasheet`) | Refrescar item data post-save para reflejar cambios |
| **Frontend** (Chart) | Phase lines verticales en `startDate`/`endDate`, labels "STO#N", badge del STO activo |
| **Frontend** (UI) | Toast de feedback cuando STO cambia de estatus |

---

## Plan de verificación

### Evaluación automática
1. Crear un STO con criterio: `<= 10 ocurrencias por día, durante 3 días consecutivos`
2. Registrar día 1: 8 ocurrencias → estatus: in_progress
3. Registrar día 2: 5 ocurrencias → estatus: in_progress
4. Registrar día 3: 10 ocurrencias → estatus: **mastered** automáticamente
5. Verificar que el `endDate` se seteó en el STO
6. Verificar que el siguiente STO pasó a in_progress con `startDate` correcto
7. Probar caso de fallo: día con 15 ocurrencias rompe la racha, reinicia conteo

### Visualización en chart
8. Con STO#1 mastered (tiene `startDate` y `endDate`): verificar que aparecen 2 líneas verticales punteadas y label "STO#1" centrado entre ambas
9. Con STO#2 mastered y STO#3 activo: verificar que el chart muestra las fases separadas correctamente
10. Verificar que arriba del chart aparece el badge con el nombre completo del STO in_progress
11. Caso Mastery Criteria (1 solo objective): verificar que muestra "Mastery Criteria: {nombre}" sin phase lines de STOs
