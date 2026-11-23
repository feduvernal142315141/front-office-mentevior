# Pedidos backend — Baseline Time-sampling: Daily Average %

**Fecha:** 2026-11-23
**Origen:** ticket "Cuando se escoja un type correspondiente a Time-Sampling" — agregar en el Baseline un campo **Daily Average %**.
**Aplica a:** Momentary Time Sampling, Partial Interval y Whole Interval.
**Complementa:** `docs/pedidos-backend-2026-11-19-baselines-unit-of-time-y-time-sampling.md`.

---

## Qué pidió el ticket

En el baseline de los tipos Time-sampling hay un campo nuevo, **Daily Average %**:

- Valor numérico guardado como **string**, **obligatorio**.
- El analista lo escribe con coma o con punto (`66,7` o `66.7`).
- **Es el valor que se grafica** en la colección de datos.

## Qué hace el front (ya implementado)

- Campo nuevo "Daily Average %" en cada fila de baseline de Time-sampling. Acepta dígitos y un separador (coma o punto). Obligatorio, entre 0 y 100.
- El front envía el texto **tal cual lo escribió el analista**, sin cambiar la coma por punto.
- La gráfica de Interval dibuja el baseline con este valor. Para convertirlo a número, el front cambia la coma por punto.
- Baselines antiguos sin el campo: la gráfica sigue calculando el % con los "+" de la datasheet.

Contrato de cada fila de `baseline[]`:

```json
{
  "id": "uuid (solo si ya existe)",
  "date": "2026-10-16T00:00:00.000Z",
  "value": 0,
  "periodCatalogId": "uuid",
  "intervalLength": 30,
  "unitOfTime": "SECONDS",
  "suggestedNumberOfRecordings": 10,
  "dailyAveragePercent": "66,7",
  "environmentalChanges": "",
  "show": true
}
```

---

## Cómo se representa en la datasheet (ya implementado)

- El Daily Average % de un día de baseline se convierte en "+" en los intervalos: no importa el orden, solo cuántos. **40% con 10 intervalos = 4 "+"**, los primeros 4, y el resto "−". El redondeo es al entero más cercano.
- La fila Daily average de ese día muestra el valor escrito por el analista mientras no se toquen los intervalos.
- **Edición bidireccional:** si el analista cambia los "+" de un día de baseline en la datasheet, el front recalcula el Daily Average % y lo envía a `PUT /client-service-plan-category-item-baseline/values` para que el Service Plan también se actualice.

Entrada nueva de ese endpoint (solo cuando cambian los "+"):

```json
{ "baselines": [{ "id": "uuid", "value": 4, "dailyAveragePercent": "40", "environmentalChanges": null }] }
```

---

## Pedidos

| # | Pedido | Prioridad |
|---|--------|-----------|
| 1 | Persistir `dailyAveragePercent` (string) por baseline | **Crítica** |
| 2 | Devolverlo en los dos GET con el mismo nombre | **Crítica** |
| 3 | Validación: obligatorio solo en Time-sampling | Alta |
| 4 | Copiarlo al clonar el service plan | Alta |
| 5 | Usarlo en reportes que hoy calculan el % del baseline | Media |
| 6 | Migración de baselines existentes | Media |
| 7 | `PUT …/baseline/values` acepta y guarda `dailyAveragePercent` | **Crítica** |

### 1. Persistir `dailyAveragePercent`

Columna nueva en `client-service-plan-category-item-baseline`, tipo **string**.

- **No guardarlo como número.** El analista puede escribir `66,7` o `66.7` y el front lo muestra tal cual. Si backend prefiere normalizar, que lo **devuelva** de la forma en que se definió, y avisemos para ajustar el front.
- Se envía en `PUT /client-service-plan-category-item/level` dentro de `baseline[]`.

### 2. Devolverlo en los GET

Mismo nombre, `dailyAveragePercent`, en:

- `GET /client-service-plan-category-item/{id}/level`
- `GET /client-service-plan-category-item/item-by-client-service-plan-category-id/{catId}` (lo usa la datasheet y la gráfica)

> ⚠️ **Sin este punto la gráfica no usa el valor del analista:** al recargar, el campo queda vacío y la configuración del item marca error al guardar.

### 3. Validación

- **Time-sampling** (Partial Interval, Momentary Time Sampling, Whole Interval): obligatorio, string no vacío. El front valida que sea un número de 0 a 100 con coma o punto.
- **Resto de tipos:** ignorarlo o guardarlo como `null`. El front no lo envía.
- **Decisión de formato:** confirmar si backend valida el formato (aceptar coma y punto) o solo que no venga vacío.

### 4. Clonado (`POST /client-service-plan/clone-to-client`)

Si el clonado copia baselines, debe copiar también `dailyAveragePercent`.

### 5. Reportes y cálculos

Cualquier reporte, PDF del Assessment, Clinical Monthly o resumen de IA que muestre el baseline de Time-sampling debe usar `dailyAveragePercent` como el valor del día.

- Hoy `value` es la cantidad de intervalos con "+" que se marca en la datasheet (`PUT /client-service-plan-category-item-baseline/values`). **No es el valor graficado.**
- Al convertirlo a número, tratar la coma como separador decimal.

### 7. `PUT /client-service-plan-category-item-baseline/values`

Ahora acepta `dailyAveragePercent` (string) junto a `value` y `environmentalChanges`, y lo guarda. Si no viene en la entrada, **no debe modificar** el valor guardado. Sin esto, editar los intervalos en la datasheet no actualiza el Service Plan.

### 6. Migración

Los baselines de Time-sampling que ya existen no tienen `dailyAveragePercent`.

- **Opción A (preferida):** dejarlo en `null`. El front usa los "+" para esos días.
- **Opción B:** rellenarlo con `value / suggestedNumberOfRecordings * 100`, redondeado a 1 decimal.
- Si es obligatorio en base de datos, la columna debe aceptar `null` para filas antiguas y exigirse solo al crear o editar.

---

## Pregunta abierta para producto

El ticket dice que Daily Average % es lo que se grafica, pero la datasheet sigue calculando por separado el % de cada día con los "+". Si el analista escribe un Daily Average % distinto del que salen de la datasheet en un día de baseline, **la gráfica usa el escrito a mano**. Confirmar con Rosemary o Miriam si es lo esperado.

---

## Pendiente en el radar: generación de objetivos para Time-sampling

Aviso del equipo de producto: la generación de objetivos (Service Plan) para Partial Interval, Momentary Time Sampling y Whole Interval **deberá corregirse**, pero aún no está definido cómo. Hoy no se cambió nada. Cuando se defina, revisar también el prefill desde baselines y la metadata de IA, que hoy leen `value` y no `dailyAveragePercent`.

---

## Checklist para backend

- [ ] Columna `dailyAveragePercent` (string) en el baseline
- [ ] Se guarda desde `PUT …/level`
- [ ] Se devuelve en `GET …/{id}/level`
- [ ] Se devuelve en `GET …/item-by-client-service-plan-category-id/{catId}`
- [ ] Obligatorio solo en Time-sampling
- [ ] `PUT …/baseline/values` acepta y guarda `dailyAveragePercent`; si no viene, no lo borra
- [ ] Clonado lo copia
- [ ] Reportes de Time-sampling lo usan como valor del baseline
- [ ] Migración de baselines existentes
