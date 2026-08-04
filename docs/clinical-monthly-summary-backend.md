# Clinical Monthly — campo `summary` único

> Fecha: 2026-08-04
> Relacionado: `plans/SCRUM-163-clinical-monthly.md`

## Qué cambió en el front

El formulario de Clinical Monthly se simplificó: **todo el contenido del reporte
se genera en el PDF** a partir del Service Plan del cliente, así que la captura
por item desapareció.

| Antes | Ahora |
| --- | --- |
| Cliente + rango | Cliente + rango *(sin cambios)* |
| Por cada item del Service Plan: `Monthly Data Progress` + `Comments / Procedure Change` | **Un solo campo `Summary`** para todo el reporte |

Guía que se muestra dentro del campo nuevo (mismo formato que las session notes):

> *Provide comments on procedure changes and/or any progress in the data collection.*

Es decir, el `Summary` cumple el rol que antes repartían `monthlyDataProgress` y
`commentsProcedureChange`, pero una sola vez por reporte en lugar de una por item.

## Estado: ✅ implementado en backend (2026-08-04)

La propiedad se llama **`summary`** en todo el contrato. El nombre anterior
(`sumary`, con el typo) ya no forma parte del JSON. El valor se guarda como texto
en `clinical_monthly.summary` y se muestra en `Document information > Summary`
dentro del PDF.

`ClinicalMonthlyItemData` quedó retirado: el reporte tiene un único `summary` en
el registro padre y los items ya no reciben textos.

| Endpoint | Cambio |
| --- | --- |
| `GET /reports/clinical-monthly` | Cada registro devuelve `summary`. |
| `POST /reports/clinical-monthly/preview` | Recibe `summary`. |
| `GET /reports/clinical-monthly/{clinicalMonthlyId}` | Devuelve `summary` en la raíz. |
| `PUT /reports/clinical-monthly/{clinicalMonthlyId}` | Recibe y actualiza `summary`. |
| `GET /reports/clinical-monthly/preview?clinicalMonthlyId={id}` | El PDF usa el `summary` persistido. |

### Migración de base de datos

Ejecutar manualmente durante el despliegue
`scripts/sql/2026-08-04_remove_clinical_monthly_item_data_add_summary.sql`:
renombra `sumary` → `summary`, conserva el valor si ambas columnas existen, crea
`summary TEXT` si no existe ninguna, y elimina `clinical_monthly_item_data`.

> ⚠️ **Orden de despliegue: backend + migración primero.** El front manda
> `summary` siempre; contra un backend sin migrar el campo se ignora en silencio
> y el usuario ve "Clinical Monthly created" con el texto perdido, sin error.

## Contrato

### `POST /reports/clinical-monthly/preview` y `PUT /reports/clinical-monthly/{id}`

Reciben y persisten un campo `summary` de nivel raíz:

```json
{
  "clientId": "00000000-0000-0000-0000-000000000000",
  "startMonthYear": "05/2026",
  "endMonthYear": "07/2026",
  "summary": "Se ajustó el prompting de Manding por dependencia de prompts posicionales..."
}
```

- Tipo: `string`, sin tope de longitud definido por ahora.
- El front lo manda **siempre y con contenido**: el formulario no deja guardar ni
  previsualizar con el campo vacío, y lo envía trimmeado. O sea, nunca llega `""`
  ni sólo espacios.

### `GET /reports/clinical-monthly/{id}`

Devuelve `summary` en el detalle, que es de donde se precarga al editar:

```json
{
  "id": "...",
  "startMonthYear": "05/2026",
  "endMonthYear": "07/2026",
  "summary": "..."
}
```

Los items de `categories[].items[]` ya **no** incluyen `monthlyDataProgress` ni
`commentsProcedureChange`.

### `GET /reports/clinical-monthly` (listado)

Cada elemento del response paginado incluye `summary`:

```json
{
  "id": "...",
  "clientId": "...",
  "clientName": "Example Client",
  "startDate": "2026-05-01",
  "endDate": "2026-07-31",
  "summary": "Clinical summary for the selected period.",
  "active": true
}
```

### PDF

El `summary` sale en `Document information > Summary`, en el lugar donde antes
aparecían los textos por item.

## Lo que NO cambia

- `clientId`, `startMonthYear` y `endMonthYear` siguen igual, en formato `MM/yyyy`.
  El selector de fecha nuevo es sólo de UI: emite exactamente el mismo formato.
- Las validaciones actuales se mantienen: rango obligatorio, `endMonthYear >=
  startMonthYear` y tope de 12 meses. El front las sigue comprobando antes de llamar
  (`lib/modules/clinical-monthly/utils/month-range.ts`).
## Resuelto

- **`items[]`**: `ClinicalMonthlyItemData` está retirado del backend, así que el
  tipo `ClinicalMonthlyItemInput` y la clave `items` del DTO se eliminaron del
  front. Ya no hay riesgo de borrado accidental al editar reportes viejos.
- **`summary` en el DTO**: ahora es requerido (`summary: string`), acorde a que
  el formulario no deja guardar sin él.

## ⚠️ Pendiente de confirmar con backend

1. **¿El listado sigue devolviendo `createAt`?**
   El ejemplo del contrato del 2026-08-04 no lo incluye, pero la tabla tiene una
   columna que lo pinta (`useClinicalMonthlyTable.tsx`). Se tipó como opcional y
   la celda cae en `—` cuando no llega, así que no rompe; si el campo
   desapareció de verdad, hay que quitar la columna.

2. **¿El detalle conserva `recipientName`, `payer`, `providerName` y `clientName`?**
   El ejemplo del contrato sólo muestra lo que cambió. El formulario de edición
   los lee para las tarjetas de Recipient y Provider; si se fueron, esa cabecera
   queda vacía (cae en `—`, no crashea).
