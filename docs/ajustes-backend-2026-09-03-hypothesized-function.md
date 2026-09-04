# Hypothesized Function — alineación del front (contrato backend 2026-09-03)

> Contrato de referencia: `hypothesizedFunction` pasa a configurarse en el item del Client
> Service Plan y desde ahí **precarga** el Assessment, que puede sobrescribirla para ese
> assessment sin tocar el Service Plan. Base DEV: `https://api.dev.mentevior.com`.
>
> Ojo: una primera versión del contrato (mismo día) sacaba el campo de los requests de
> Assessment; la versión vigente lo mantiene. Este documento describe la vigente.

## Qué cambió

| Método | Endpoint | Cambio |
|---|---|---|
| `PUT` | `/client-service-plan-category-item/level` | request acepta `hypothesizedFunction` (nullable) |
| `GET` | `/client-service-plan-category-item/{id}/level` | response devuelve `hypothesizedFunction` |
| `GET` | `/client-service-plan/client/{clientId}/assessment-data` | response agrega `categories[].items[].hypothesizedFunction` |
| `POST` | `/assessments` | request **mantiene** `categoriesItems[].hypothesizedFunction` |
| `PUT` | `/assessments` | request **mantiene** `categoriesItems[].hypothesizedFunction` |

Enum: `ESCAPE | ATTENTION | SENSORY | TANGIBLE`.

Reglas de propagación: el backend copia el valor del item del Service Plan al snapshot del
Assessment al crearlo; si el request trae otro valor, ese gana **sólo en el snapshot**.
`PUT /assessments` puede cambiar el valor del `AssessmentCategoryItem` sin alterar el
`ClientServicePlanCategoryItem`. `GET /assessments/{id}` devuelve el del snapshot.

## Qué se hizo en el front

**Tipo y catálogo compartidos** — el dueño del dato ya no es el Assessment:

- `HypothesizedFunction` se define en `lib/types/data-collection.types.ts`;
  `lib/types/assessment.types.ts` lo re-exporta para no romper imports.
- `lib/constants/hypothesized-function.ts` (nuevo) concentra labels, opciones y
  `parseHypothesizedFunction()`, que descarta valores desconocidos y `null`.

**Client Service Plan — se edita acá:**

- `lib/modules/client-service-plan/services/client-data-collection.service.ts`:
  el campo entra al `ClientItemPayload`, al `UpsertClientItemDataCollectionDto` y a la
  lectura de `fromApiItemResponse` (también cuenta para `hasContent`, así un item cuyo
  único dato sea la función no cae al fallback de la categoría).
- `app/(app)/clients/[id]/configuration/components/ItemDetailPanel.tsx`: select
  **Hypothesized Function** a la derecha de Teaching Procedure, con dirty tracking propio
  (mismo patrón que `teachingProcedure`, que vive fuera de react-hook-form).
  Aplica a las tres categorías — Caregiver Training, Maladaptive Behaviors y Replacement
  Behaviors comparten este panel.

**Assessment — editable, con precarga del Service Plan:**

- `lib/modules/assessments/services/client-category-items.service.ts` apunta ahora a
  `/client-service-plan/client/{clientId}/assessment-data` (antes `/category-items`), que es
  el único que trae `hypothesizedFunction` por item. Acepta tanto `{ categories: [...] }`
  como el array plano del endpoint viejo.
- `useAssessmentForm` expone `hypothesizedFunctionByItemId`: **sólo la precarga** del Service
  Plan. El valor elegido por el usuario vive en `formData.categoryItems[itemId]`, como los
  demás campos del item.
- `CategoryItemsSection` muestra `value.hypothesizedFunction || precarga`. Limpiar el item
  (botón *Clear*) vuelve a mostrar la precarga.
- `buildPayload` envía lo que el usuario ve: su elección o, si no tocó el select, la
  precarga. Así el snapshot queda igual a la pantalla.
- El check de "item tocado" vuelve a contar la función hipotetizada: sólo hay entrada en
  `categoryItems` cuando el usuario tocó el item (o cuando se precargó un assessment
  existente), así que la precarga por sí sola no manda items al backend.

## Layout del panel del item

La grilla es `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` y auto-ubica de izquierda a
derecha, así que agregar una celda partía el par Teaching Procedure + Hypothesized Function
en varios tipos. `pairSplitsAt()` simula la ubicación de las celdas previas y, cuando la
fila no deja dos columnas libres, Teaching Procedure abre fila nueva (`sm:col-start-1` /
`lg:col-start-1`, con `col-start-auto` para resetear por breakpoint):

| Type | celdas previas | rompe en sm (2 col) | rompe en lg (3 col) |
|---|---|---|---|
| Percentage of Opportunities, Trial… | 1 | sí | no |
| Frequency, Frequency/Count | 2 | no | sí |
| Rate | 3 | sí | no |
| Measurement Log | 4 | no | no |
| Duration, Latency, Interresponse | 5 | sí | sí |
| Time-sampling | 4 (una celda con `col-span-2`) | no | sí |

Si se agregan o quitan campos condicionales a la grilla hay que actualizar
`leadingGridSpans` en `ItemDetailPanel.tsx`.

## Pendiente de confirmar con backend

1. **Claves ausentes en el `PUT` del nivel.** `ClientDataCollectionModal` y
   `ClientDataCollectionDrawer` guardan el mismo endpoint pero no exponen ni
   `teachingProcedureId` ni `hypothesizedFunction`, así que omiten esas claves del payload.
   ¿El backend preserva lo persistido cuando la clave no viene, o lo pone en `null`?
   Si lo pone en `null`, guardar desde esas dos pantallas borra lo configurado.
2. **`/category-items` vs `/assessment-data`.** Los dos siguen publicados en dev
   (`getCategoriesWithItemsByClient` y `getAssessmentDataByClient`) y ninguno está tipado en
   el swagger (`type: object`). El front migró a `assessment-data`: confirmar que
   `/category-items` queda deprecado y que `assessment-data` devuelve siempre
   `{ categories: [...] }`.
3. **Precarga al editar.** Si el snapshot del assessment tiene la función en `null` pero el
   item del Service Plan sí la tiene, la pantalla muestra la del Service Plan y al guardar
   la persiste en el snapshot. Es coherente con el relleno legacy que hace el backend en la
   lectura, pero conviene confirmarlo.
