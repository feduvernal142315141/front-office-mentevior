# Pregunta para backend — Unidad de los baselines al cambiar la unidad del ítem

**Fecha:** 2026-11-23
**Tipos afectados:** Rate, Duration, Latency e Interresponse time
**Relacionado con:** `docs/respuesta-backend-2026-11-23-ajustes-baselines.md`

---

## Contexto

Ya alineamos el front para que cada baseline conserve su unidad guardada (`unitOfTime`) y su `periodCatalogId`, en lugar de reescribirlos con la unidad actual del ítem al guardar.

Según el informe de cambios de backend del 2026-11-23, los GET de configuración (`GET …/{id}/level` y `GET …/item-by-client-service-plan-category-id/{catId}`) devuelven los valores originales y no agregan `normalizedValue`. Ese campo solo existe hoy en las notas de cita (`GET /appointment/{id}/note` y `/note/97156`) y en Clinical Monthly.

Para graficar y mostrar en datasheets necesitamos todos los valores de un mismo ítem en su unidad actual. Hoy no tenemos una forma definida de hacerlo.

## Ejemplo

Un ítem de Duration se configuró en MINUTES y un baseline quedó con `value: 8`, `unitOfTime: MINUTES`. Luego el ítem cambió a HOURS. El baseline sigue en 8 minutos. Para graficarlo junto con los demás valores en horas, necesitamos 0.13 horas, no 8.

## Pregunta

¿Cuál opción aplican?

**A) Campo normalizado desde backend.** Agregar `normalizedValue` a cada baseline en los dos GET de configuración, expresado en la unidad actual del ítem, conservando `value` y `unitOfTime` originales. Hoy este campo solo existe en notas y Clinical Monthly.

**B) Conversión en front.** Sin cambios en backend. El front convierte con factores fijos (segundos, minutos, horas, días) a partir de `value` y `unitOfTime`. Se necesita confirmar que la conversión es lineal y que Rate usa `value / sessionDuration` en la unidad del baseline.

## Recomendación

**Opción A.** Así la conversión queda en un solo lugar y gráficas, datasheets, PDF y reportes usan el mismo cálculo.

Si se elige **B**, el front ya tiene conversión para duraciones de sesión (`getSessionDurationInUnit` en `datasheets/rate-datasheet.types.ts`), pero solo se necesita confirmar factores y fórmula.

## Decisiones que dependen de esto

- Si se elige A: definir el contrato de `normalizedValue` en los GET de `/level` y ajustar el front para consumirlo.
- Si se elige B: confirmar factores y fórmula, y agregar la conversión en el front antes de subir los cambios de unidad.
- En ambos casos, la regla de conservar la unidad histórica queda como está.

---

## Decisión

**Opción A confirmada por backend.** `normalizedValue` se agrega a cada baseline en `GET …/{id}/level` y `GET …/item-by-client-service-plan-category-id/{catId}`, en la unidad actual del ítem. `value` y `unitOfTime` originales no cambian.

Para Rate, `normalizedValue` es la tasa en ocurrencias por la unidad actual del ítem.

Pendiente de confirmar con backend:
- Si `normalizedValue` puede ser `null` cuando no hay conversión fiable.
- Si entra en la misma entrega que la regla de unidades históricas o en una posterior.
- Fecha estimada de disponibilidad en dev.

## Front: hecho (pendiente de probar con backend)

- `normalizedValue?: number | null` agregado al tipo del baseline (`ClientServicePlanItemBaseline` y `DataCollectionBaselineData`) y al servicio.
- Helper `lib/utils/baseline-plot-value.ts`:
  - Si `normalizedValue` viene (incluido `null`), se usa tal cual. No se sustituye por `value`.
  - Si el campo no viene, se usa `value`, como antes.
- Gráficas que lo usan: `DurationChart`, `FrequencyChart`, `RateChart`, `ReadOnlyItemChart` (vista de charts) y `SessionItemChartPanel` (notas).
- `RateChart`: si viene `normalizedValue`, la tasa ya está calculada y no se divide otra vez por la duración.
- Sin cambios: `useDurationDatasheet` y el envío de `/values` siguen usando `value` (son escrituras).
- No cubierto aún: Time-sampling (`PercentageChart`, `IntervalDatasheet`). Backend define su `normalizedValue` como porcentaje con el denominador del día, lo que choca con el Daily Average % pendiente de decisión.

## Para probar cuando backend suba

- Item de Duration en MINUTES con baseline 8: después de cambiar a HOURS, la gráfica debe mostrar 0.13 h.
- Baseline con `normalizedValue: null`: no debe dibujarse ni mostrarse como 0.
- Rate con unidad histórica distinta: la tasa no debe dividirse dos veces.
- Sin el campo (backend actual): las gráficas deben verse igual que antes.
