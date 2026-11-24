# Respuesta al backend — Ajustes propuestos a la solicitud de Baselines

**Fecha:** 2026-11-23
**Responde a:** "Ajustes propuestos a la solicitud de Baselines" (revisión del 2026-11-23)

Revisamos su propuesta y la tomamos como base. Este documento solo cubre los ajustes de código.

---

## Ya hecho en el front

- El **Daily Average %** se guarda como string y se envía tal cual lo escribe el analista, con coma o punto.
- La gráfica de Interval usa ese valor para dibujar el baseline.
- Los "+" de la datasheet se derivan del porcentaje: 40% de 10 intervalos son los primeros 4 "+", el resto "−".
- Si el analista edita los "+" de un día de baseline, el front recalcula el porcentaje y lo envía a `PUT /client-service-plan-category-item-baseline/values` junto con `value`.
- Si el baseline no tiene `dailyAveragePercent` (datos antiguos), la gráfica sigue calculando con los "+".
- El item y la categoría ya usan `recordingsNumber`. La fila de baseline usa `suggestedNumberOfRecordings`.

## Pendiente en el front

- Acotar `value` entre `0` y el total de intervalos del día antes de guardar. Hoy solo se acota al mostrar.
- Definir el redondeo cuando el porcentaje escrito no da un número entero de "+". Ejemplo: 33% de 10 da 3 "+"; si el front recalcula, queda en 30%.

## Lo que necesitamos del backend

| Pedido | Endpoint |
|--------|----------|
| Guardar y devolver `dailyAveragePercent` (string) | `PUT /client-service-plan-category-item/level` y ambos GET |
| Aceptar y guardar `dailyAveragePercent` sin borrarlo si no viene | `PUT /client-service-plan-category-item-baseline/values` |
| Hacer `recordingsNumber` opcional en Duration, Latency e Interresponse time | endpoints `/level` de compañía y cliente |

Mientras `recordingsNumber` siga obligatorio, el front envía `10` oculto.

## Lo que no hace falta cambiar

- **Clonado:** si la plantilla de compañía no tiene baselines, no hay qué copiar. Queda como "no aplica".
- **Nombre `recordingsNumber`:** no se renombra. Solo pedimos que sea opcional, no que se elimine.

## Pendiente con producto

- **Cambio de unidad:** si al cambiar la Unit of time del item se reinterpretan los baselines o se conserva el histórico. Hasta que se defina, el front reinterpreta sin convertir.
- **Fórmula de Rate:** si `value` es un conteo de ocurrencias o una tasa ya calculada.
- **Fuente de verdad en Time-sampling:** si manda `dailyAveragePercent` o `value` cuando no coinciden por redondeo.
