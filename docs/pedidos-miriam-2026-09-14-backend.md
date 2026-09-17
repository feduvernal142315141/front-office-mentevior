# Pedidos que requieren cambios de backend — 2026-09-14

Pedidos del documento de Miriam y Lidia que **no se pueden completar** solo con frontend.
Cada sección describe qué necesitamos y la propuesta de contrato.

---

## M9 — Teaching Method multi-select en Session Notes

**Prioridad:** Alta (afecta 97153 y 97156)

### Situación actual
- `teachingMethodId` es un campo `string` (un solo UUID) tanto en 97153 como en 97156.
- El backend recibe `teachingMethodId: string | null` en los PUT de las notas.
- 97155 no tiene Teaching Method.

### Qué se necesita
Que el campo acepte **múltiples** teaching methods por nota.

### Propuesta de contrato

**PUT `/appointment/note/{id}`** (97153) y **PUT `/appointment/note-97156/{id}`** (97156):

Cambiar `teachingMethodId` de `string | null` a `teachingMethodIds: string[]`:

```json
{
  "teachingMethodIds": ["uuid-dtt", "uuid-net", "uuid-incidental"]
}
```

Si se prefiere mantener backward compatibility, aceptar ambos campos y dar prioridad
al array:

```json
{
  "teachingMethodId": null,
  "teachingMethodIds": ["uuid-dtt", "uuid-net"]
}
```

**GET `/appointment/note/{id}`** y **GET `/appointment/note-97156/{id}`**:

Agregar `teachingMethods: { id: string; name: string }[]` al response:

```json
{
  "teachingMethod": { "id": "uuid-dtt", "name": "DTT" },
  "teachingMethods": [
    { "id": "uuid-dtt", "name": "DTT" },
    { "id": "uuid-net", "name": "NET" }
  ]
}
```

Mantener `teachingMethod` (singular) para backward compat con logs anteriores que solo
tienen uno. Frontend usará `teachingMethods` cuando exista; si no, fallback a
`[teachingMethod]`.

### Notas
- 97155 no tiene Teaching Method — Miriam lo mencionó con "(HN)" (hora nota), verificar
  si realmente quiere agregarlo a 97155 o si se refiere solo a 97153 y 97156.
- El catálogo de teaching methods (`GET /teaching-method/catalog`) no cambia.

---

## M8 — Environmental Changes: mostrar texto del analista, no EC1/EC2

**Prioridad:** Media

### Situación actual
- El frontend numera los environmental changes como EC1, EC2, EC3... en orden de fecha.
- Esto se hace porque el backend **no devuelve un label** por cada environmental change.
- En el contrato del 2026-09-07 se pidió un campo `environmentalChangesLabel` por cada
  nota de cambio ambiental; nunca se entregó.
- Código: `environmental-changes-display.tsx:58` comenta:
  > "The contract does NOT bring a label per change — what was requested in B1 was an
  > `environmentalChangesLabel` alongside each note, which never arrived"

### Qué se necesita
Que cada registro de environmental change incluya el texto/label que escribió el analista.

### Propuesta de contrato

En **GET `/client-data-collection`** y **GET `/client-data-collection/by-category-id/{categoryId}`**,
cada registro que tenga `environmentalChange` debería incluir también un label:

```json
{
  "id": "...",
  "value": 3,
  "environmentalChange": "Started new medication (Ritalin 10mg)",
  "environmentalChangeLabel": "Medication change"
}
```

**Alternativa más simple:** si no se quiere agregar un campo separado de label, el frontend
puede usar directamente el texto de `environmentalChange` como label en el chart (truncado
a ~20 chars). En ese caso **no se necesita cambio de backend** — solo una decisión de
producto sobre si el texto completo o un resumen es lo que va en la gráfica.

### Acción intermedia sin backend
Se puede hacer que el modo "Label" muestre un preview truncado del texto de
`environmentalChange` en vez de "EC1, EC2". Requiere que el `environmentalChange` (texto
libre) ya esté disponible en los datos que llegan al chart — **verificar si llega**.

---

## M4 — Multi-select en settings del Assessment (parcial)

**Prioridad:** Media

### Situación actual
- `hypothesizedFunction` **ya es multi-select** (tipo `HypothesizedFunction[]`).
- `intensity` es un enum string simple (`AssessmentIntensityKey`): "MILD" | "MODERATE" | "SEVERE".
- Los otros campos (prevalentSetting, preventiveStrategies, managementStrategies) son
  `string` libre (text inputs).

### Qué se necesita
Miriam pide que los dropdowns sean multi-select. De los campos que son dropdown:
- `hypothesizedFunction` → **ya resuelto**
- `intensity` → actualmente es single-select (Mild/Moderate/Severe)

### Pregunta para Miriam
¿Realmente necesita multi-select en Intensity? Un behavior puede ser "Mild AND Severe"
simultáneamente? Parece inusual en ABA. Si sí:

### Propuesta de contrato (solo si se confirma)

Cambiar `intensityKey` de `string | null` a `intensityKeys: string[]` en:

- **POST/PUT** del assessment: `intensityKeys: ["MILD", "MODERATE"]`
- **GET** del assessment: `intensityKeys: ["MILD", "MODERATE"]`

---

## M3 — Estimado de masterización

**Prioridad:** Por aclarar

### Situación actual
- El campo `Estimated End Date` ya existe en el modal de edición de STO/objetivo.
- Los items en la tabla de objectives muestran columnas: Name, Start date, Est. End Date,
  End date, Status.

### Qué aclarar con Miriam
1. ¿El campo ya existe pero no se está guardando/mostrando correctamente?
2. ¿O necesita un **cálculo automático** del estimado de masterización basado en la
   tendencia de los datos de data collection (regresión lineal)?
3. ¿Aplica solo a maladaptive behaviors o también a replacement/skills?

Si es cálculo automático, requiere:
- Definir la fórmula (proyección lineal desde los últimos N datapoints hasta el
  valor target del STO)
- Decidir si se calcula en frontend (con los datos del chart) o en backend
- Decidir dónde se muestra (en el banner de objective, en la tabla de STOs, en el chart)

**No se puede avanzar sin aclaración.**

---

## L2 — NPI/MPI en Service Log

**Estado: RESUELTO**

Backend ya entregó (rama `codex/service-log`, commit `1034c96`, migración V32).
Frontend ya integrado (commit `a5277b1`).

---

## Resumen

| Pedido | Bloqueado por backend | Acción |
|--------|-----------------------|--------|
| M9 | Sí — campo `teachingMethodIds` (array) | Enviar propuesta de contrato |
| M8 | Parcial — `environmentalChangeLabel` nunca llegó | Podemos usar texto truncado como workaround |
| M4 | Parcial — solo si Miriam confirma multi-select en Intensity | Preguntar primero |
| M3 | Aclarar — no se sabe si es campo existente o cálculo nuevo | Preguntar a Miriam |
| L2 | No — ya resuelto | ✅ |
