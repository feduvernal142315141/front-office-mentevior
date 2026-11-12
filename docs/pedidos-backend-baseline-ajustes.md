# Pedidos backend — Baseline ajustes

Rama de front: `baseline-ajustes` (todos los puntos en una sola rama, sin push todavía).
Endpoint afectado: `PUT /client-service-plan-category-item/level` (`baseline[]`) y las lecturas del item / service plan.

## Resumen

| # | Punto | Front | Backend |
|---|-------|-------|---------|
| 1 | Rate: Period → Unit of time | Hecho | Sí |
| 2 | Duration: Period → Unit of time; sin Session duration ni Suggested recordings | Hecho | Sí |
| 3 | Latency: Period → Unit of time; sin Suggested recordings | Hecho | Sí |
| 4 | Interresponse time: Period → Unit of time; sin Suggested recordings | Hecho | Sí |
| 5 | Time-sampling (Partial, Momentary, Whole Interval): config propia por día | Hecho | Sí |
| 5b | Interval: baseline fijo en el calendario y baseline como puntos en la gráfica | Hecho | No |

---

## Pedidos comunes (puntos 1–4)

1. **Catálogo de Period con unidades**: debe incluir Seconds / Minutes / Hours / Days (confirmar si falta Seconds).
   El front, para Rate/Duration/Latency/Interresponse, oculta Period y manda en `periodCatalogId` el del catálogo que coincide con la Unit of time del item.
2. **Idealmente** un campo propio de unidad en el baseline, o `periodCatalogId` opcional para estos tipos.
3. **Migración de baselines existentes**: la duración/valor guardado está en la unidad del Period viejo.
4. **Riesgo**: si el item cambia luego su Unit of time, el valor guardado se reinterpreta.
5. **Verificar** que `periodCatalogId` se persiste al cambiarlo (en pruebas el Period no parecía guardarse; el front sí lo envía).

## Punto 1 — Rate
- Sigue exigiendo `sessionDuration` (>0) solo para Rate.

## Punto 2 — Duration
- Dejar de exigir `sessionDuration` (hoy obligatorio en Rate y Duration → solo Rate).
- Dejar de exigir/usar `suggestedNumberOfRecordings` (el front manda 10 oculto).
- Baselines Duration ya guardados con `sessionDuration`: ignorar o limpiar.

## Punto 3 — Latency (`Latency` y `Response latency`)
- Dejar de exigir `suggestedNumberOfRecordings` (el front manda 10 oculto). Nunca tuvo Session duration.

## Punto 4 — Interresponse time
- Igual que Latency: no exigir `suggestedNumberOfRecordings`.

**Decisión de producto pendiente (2–4):** la datasheet usa `suggestedNumberOfRecordings` para saber cuántas filas de registro muestra por día (hoy 10 fijo). Si se elimina el campo, definir si queda 10 fijo o filas dinámicas.
**Alcance front:** solo `ItemDetailPanel` y el schema del cliente; `ClientDataCollectionModal`, `ClientDataCollectionForm` y el `DataCollectionForm` de la compañía siguen mostrando Suggested recordings para Duration.

## Punto 5 — Time-sampling: baseline por día con su propia config

Front: en el baseline se quitan Value y Period; se agregan por fila Interval length, Unit of time y Suggested number of recordings (por defecto, los del Type). La datasheet calcula cada día de baseline con su propio número de intervalos; los días fuera del baseline usan el Type.

**Contrato nuevo en `baseline[]`:**

| Campo | Tipo |
|-------|------|
| `intervalLength` | number |
| `unitOfTime` | `SECONDS` \| `MINUTES` \| `HOURS` \| `DAYS` |
| `suggestedNumberOfRecordings` | number |

Pedidos:
- (a) Persistir los 3 campos por baseline; devolverlos al leer (item y listado del service plan) y copiarlos al clonar el service plan.
- (b) `value` y `periodCatalogId` dejan de ser obligatorios para estos tipos (hoy el front manda `periodCatalogId` = primer Period del catálogo, oculto; `value` es la cantidad de "+" editada en la datasheet).
- (c) Validar los 3 campos como requeridos solo para Time-sampling.
- (d) Baselines ya guardados: rellenar con los valores del Type o dejar null (el front usa el Type como respaldo).
- Sin backend: los 3 campos no se guardan y al recargar vuelven los valores del Type.

## Punto 5b — Interval (solo front)
Columna "BL" fija en la datasheet de Interval (como Rate) y baseline dibujado como puntos por fecha en la gráfica. Sin cambios de backend.

---

## Notas de comportamiento (informativo)
- Las fechas con un registro de Data Collection guardado se dibujan como tratamiento, nunca como baseline (explica el punto negro cuando un baseline coincide con un dato recolectado).
