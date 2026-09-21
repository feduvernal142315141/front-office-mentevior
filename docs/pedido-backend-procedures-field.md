# Tickets #13 y #14 — Campo Procedures en Service Plan y Assessment

Fecha: 2026-09-21

## Ticket #13: Campo Procedures en Service Plan (Data Collection)

### Contexto

En la configuración de Data Collection de cada item del Service Plan del cliente, se necesita
un campo de texto **"Procedures"** que aparece debajo de "Description" (topography).

Este campo aplica a **todas las categorías excepto Maladaptive Behavior**.

### Cambio requerido en backend

Agregar `procedures: string | null` a los endpoints de item data collection:

**GET `/client-service-plan-category/{id}/item`** — agregar en cada item:
```json
{
  "procedures": "Procedure text here"
}
```

**PUT item data collection** — aceptar:
```json
{
  "procedures": "Procedure text here"
}
```

**GET `/client-service-plan/client/{clientId}/assessment-data`** — incluir en cada item:
```json
{
  "categories": [
    {
      "items": [
        {
          "procedures": "Procedure text here"
        }
      ]
    }
  ]
}
```

### Migración

Agregar columna `procedures VARCHAR(MAX) NULL` a la tabla de item del client service plan.
Sin backfill necesario.

---

## Ticket #14: Description y Procedures en Assessment (Categories & Items)

### Contexto

En el Assessment, dentro de la sección Categories & Items, para categorías que **no** sean
Maladaptive Behavior:
- Reemplazar **"Preventive strategies (antecedent)"** por **"Description"** (read-only, viene
  del SP como `topography`)
- Reemplazar **"Consequence-Based Strategies"** por **"Procedures"** (read-only o editable,
  viene del SP)

Para Maladaptive Behavior, los campos "Preventive strategies" y "Consequence-Based Strategies"
se mantienen como están.

### Dependencia

Este ticket depende de que el ticket #13 se implemente primero, para que el campo `procedures`
exista en el item del SP y viaje en el borrador del Assessment.

### Cambio requerido en backend

En **GET `/client-service-plan/client/{clientId}/assessment-data`**, cada item debe incluir:
```json
{
  "clientServicePlanCategoryItemId": "...",
  "topography": "Item description text",
  "procedures": "Procedure text"
}
```

En **POST/PUT `/assessments`**, `categoriesItems[]` podría necesitar:
```json
{
  "clientServicePlanCategoryItemId": "...",
  "description": "...",
  "procedures": "..."
}
```

O bien estos campos son read-only desde el SP y no se envían en el assessment. Confirmar con
producto si son editables en el assessment o solo se muestran.

### Cambio en frontend (cuando backend esté listo)

En `CategoryItemsSection.tsx`:
- Detectar si la categoría es Maladaptive (por nombre o por un flag del backend)
- Si **es** Maladaptive: mostrar Preventive strategies + Consequence-Based Strategies (actual)
- Si **no** es Maladaptive: mostrar Description (read-only) + Procedures (read-only o editable)

### Estado

- #13: **Pendiente backend**
- #14: **Pendiente backend** (depende de #13)
