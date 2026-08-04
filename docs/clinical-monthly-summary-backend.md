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

## Lo que se pide a backend

### `POST /reports/clinical-monthly/preview` y `PUT /reports/clinical-monthly/{id}`

Aceptar y persistir un campo `summary` de nivel raíz:

```json
{
  "clientId": "00000000-0000-0000-0000-000000000000",
  "startMonthYear": "05/2026",
  "endMonthYear": "07/2026",
  "summary": "Se ajustó el prompting de Manding por dependencia de prompts posicionales..."
}
```

- Tipo: `string`, opcional, sin tope de longitud definido por ahora.
- El front lo manda **siempre** (string vacío si no se escribió nada).

### `GET /reports/clinical-monthly/{id}`

Devolver `summary` en el detalle, para precargarlo al editar:

```json
{
  "id": "...",
  "startMonthYear": "05/2026",
  "endMonthYear": "07/2026",
  "summary": "..."
}
```

### PDF

Que el `summary` salga en el documento, en el lugar donde antes aparecían los
textos por item.

## Lo que NO cambia

- `clientId`, `startMonthYear` y `endMonthYear` siguen igual, en formato `MM/yyyy`.
  El selector de fecha nuevo es sólo de UI: emite exactamente el mismo formato.
- Las validaciones actuales se mantienen: rango obligatorio, `endMonthYear >=
  startMonthYear` y tope de 12 meses. El front las sigue comprobando antes de llamar
  (`lib/modules/clinical-monthly/utils/month-range.ts`).
- El endpoint sigue aceptando `items[]`; simplemente el front ya no los manda.

## ⚠️ Dos cosas a confirmar

1. **¿El `PUT` sin `items` borra los items existentes?**
   El front **omite la clave** (no manda `items: []`) justamente para no
   dispararlo. Hay que confirmar que "clave ausente" se trate como *no tocar* y
   no como *borrar todo* — si no, un reporte viejo perdería sus textos al
   editarlo.

2. **¿El endpoint rechaza campos desconocidos?**
   Si la validación es estricta, mandar `summary` antes de que exista en el
   backend haría fallar el guardado. En ese caso avisen y lo dejamos detrás de un
   flag hasta que esté desplegado.
