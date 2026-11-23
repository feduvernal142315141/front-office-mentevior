# Pedidos backend — Baselines: Unit of time y Time-sampling por día

**Fecha:** 2026-11-19
**Front:** ya está en `main` (commits `2653873`, `d20c0a3`, `181598b`, `1da1b2c`, `96127c9`).
**Origen:** feedback de Rosemary (puntos 1 a 5) y requerimiento "Ajustes en la configuración de Baseline para Partial, Momentary y Whole Interval".
**Reemplaza y amplía:** `docs/pedidos-backend-baseline-ajustes.md`.

---

## Resumen

| # | Pedido | Tipos | Prioridad |
|---|--------|-------|-----------|
| 1 | Agregar **Seconds** al catálogo de Period | Rate, Duration, Latency, Interresponse time | Alta |
| 2 | El baseline usa la **Unit of time del item**, no su Period, para interpretar valores | Rate, Duration, Latency, Interresponse time | Alta |
| 3 | `sessionDuration` obligatorio **solo** en Rate | Rate, Duration | Alta |
| 4 | `suggestedNumberOfRecordings` deja de ser obligatorio | Duration, Latency, Interresponse time | Alta |
| 5 | Persistir `intervalLength`, `unitOfTime` y `suggestedNumberOfRecordings` **por día de baseline** | Partial Interval, Momentary Time Sampling, Whole Interval | **Crítica** |
| 6 | `value` y `periodCatalogId` opcionales en baselines de Time-sampling | Time-sampling | Media |
| 7 | Copiar los campos nuevos al clonar el service plan | Todos | Alta |
| 8 | Migración de datos existentes | Todos | Media |
| 9 | (Propuesta) Permitir `value: null` en baselines = "sin registrar" | Time-sampling | Por decidir |

---

## Endpoints involucrados

| Endpoint | Uso |
|----------|-----|
| `PUT /client-service-plan-category-item/level` | Guarda la config del item, con el arreglo `baseline[]` |
| `GET /client-service-plan-category-item/{id}/level` | Lee la config del item y sus baselines |
| `GET /client-service-plan-category-item/item-by-client-service-plan-category-id/{catId}` | Listado de items del service plan; también trae `baseline[]` (lo usa la datasheet) |
| `PUT /client-service-plan-category-item-baseline/values` | Actualización masiva desde la datasheet: `{ baselines: [{ id, value, environmentalChanges }] }` |
| `POST /client-service-plan/clone-to-client` | Clonado del service plan de la compañía al cliente |
| `PUT /service-plan-category/level`, `PUT /service-plan-category-item/level` | Config de la compañía (plantilla) |
| `PUT /client-service-plan-category/level` | Config por categoría del cliente |

---

## Contrato del baseline (`baseline[]`)

Esto es lo que el front envía hoy en cada fila:

```json
{
  "id": "uuid (solo si ya existe)",
  "date": "2026-10-16T00:00:00.000Z",
  "value": 8,
  "periodCatalogId": "uuid",
  "sessionDuration": 2.5,
  "intervalLength": 30,
  "unitOfTime": "SECONDS",
  "suggestedNumberOfRecordings": 10,
  "environmentalChanges": "",
  "show": true
}
```

| Campo | Tipo | Cuándo viaja |
|-------|------|--------------|
| `sessionDuration` | decimal `> 0` | Solo Rate |
| `intervalLength` | número `> 0` | Solo Time-sampling |
| `unitOfTime` | `SECONDS` \| `MINUTES` \| `HOURS` \| `DAYS` | Solo Time-sampling |
| `suggestedNumberOfRecordings` | entero `> 0` | Solo Time-sampling |

Todos los campos nuevos deben **persistirse** y **devolverse** con el mismo nombre en los dos GET de arriba: el detalle del item y el listado por categoría.

---

## 1. Catálogo de Period: agregar Seconds

En Rate, Duration, Latency e Interresponse time, el front oculta el Period del baseline y manda en `periodCatalogId` el Period del catálogo que corresponde a la Unit of time del item. Lo identifica por nombre: `Sec…`, `Min…`, `Hour`/`Hr`, `Day…`.

- Hoy el catálogo **no parece tener Seconds**. Cuando el item está en Seconds, el front no encuentra equivalente y manda el Period que la fila ya tenía guardado (por ejemplo Hour).
- **Pedido:** que el catálogo tenga **Seconds, Minutes, Hours y Days**, con nombres reconocibles.
- **Alternativa mejor (opcional):** que `periodCatalogId` sea opcional para estos 4 tipos. La unidad ya está en `unitOfTime` del item.

## 2. El baseline sigue la Unit of time del item

**Regla de producto (Rosemary):** en Rate, Duration, Latency e Interresponse time, el baseline no tiene Period. Usa la Unit of time elegida arriba en el item, al crear y **también al editar**. Si el usuario cambia la Unit of time del item, todas las filas de baseline pasan a esa unidad.

Qué hace el front:
- En cada guardado manda **todas** las filas con el `periodCatalogId` equivalente a la Unit of time actual del item.
- **No convierte** los números. Un baseline con `value: 8` sigue siendo 8, ahora en la unidad nueva. Igual con `sessionDuration`.
- La datasheet de Rate ya toma `sessionDuration` directamente en la Unit of time del item, sin convertir desde el Period.

Pedidos:
- Cualquier cálculo o reporte del backend que use baselines de estos 4 tipos (PDF del Assessment, Clinical Monthly, resúmenes de IA, exportes) debe interpretar `value` y `sessionDuration` **en la `unitOfTime` del item**, no en el Period de la fila.
- No convertir ni reescribir los valores cuando cambia la `unitOfTime` del item.
- Verificar que `periodCatalogId` **sí se persiste** cuando cambia. En pruebas anteriores parecía no guardarse, aunque el front lo envía.

## 3. `sessionDuration`: obligatorio solo en Rate

- **Rate:** sigue obligatorio y `> 0` en cada baseline.
- **Duration:** dejar de exigirlo. El front ya no lo muestra ni lo envía.
- Otros tipos: ignorarlo o guardarlo como `null`.
- Los baselines de Duration que ya tienen `sessionDuration` se pueden ignorar o limpiar.

## 4. `suggestedNumberOfRecordings`: opcional en Duration, Latency e Interresponse time

El front ya no muestra este campo para estos tipos en **ningún** formulario: item del cliente, Service Plan del cliente, modal de categoría y plantilla de la compañía.

- Por compatibilidad, el front sigue mandando **10** oculto en la config del item y de la categoría.
- **Pedido:** que no sea obligatorio para estos tipos en ningún endpoint de `/level`, ni de compañía ni de cliente.
- **Decisión de producto pendiente:** la datasheet de estos tipos hoy muestra 10 filas por día usando ese valor. Si el campo se elimina del todo, definir si quedan 10 fijas o si las filas pasan a ser dinámicas.

## 5. Time-sampling: configuración propia por día de baseline (crítico)

Aplica a **Partial Interval, Momentary Time Sampling y Whole Interval**.

En el baseline se quitaron Value y Period. Cada día de baseline tiene ahora su propio **Interval length**, **Unit of time** y **Suggested number of recordings**. Las filas nuevas toman por defecto los valores del Type.

Cómo los usa el front, ya implementado:
- **Cálculo independiente:** el % de cada día de baseline es la cantidad de "+" dividida entre **su** `suggestedNumberOfRecordings`.
- **Días fuera del baseline:** usan solo la config del Type.
- **Visualización:** la datasheet muestra tantas filas de intervalo como el **máximo** entre el Type y todos los días de baseline. Ese máximo solo define lo que se ve, no el cálculo.

Pedidos:
- **(a)** Persistir los 3 campos por cada baseline en `client-service-plan-category-item-baseline`.
- **(b)** Devolverlos en `GET …/item/{id}/level` y en `GET …/item-by-client-service-plan-category-id/{catId}`.
- **(c)** Validarlos como obligatorios **solo** para Time-sampling: `intervalLength > 0`, `unitOfTime` del enum y `suggestedNumberOfRecordings` entero `> 0`.
- **(d)** `PUT /client-service-plan-category-item-baseline/values` **no debe borrar ni tocar** estos 3 campos. Solo actualiza `value` y `environmentalChanges`.

> ⚠️ **Sin este punto el requerimiento no funciona:** al recargar, los 3 campos vuelven a los valores del Type y cada día de baseline calcula con la configuración del tratamiento.

## 6. `value` y `periodCatalogId` opcionales en baselines de Time-sampling

- `periodCatalogId`: el front todavía manda uno cualquiera del catálogo, oculto, solo porque el contrato lo exige. **Pedido:** que sea opcional para Time-sampling.
- `value`: ya no se carga en la configuración. Es la cantidad de intervalos con "+" que se marca en la datasheet (vía `/baseline/values`). Un baseline recién creado viaja con `value: 0`. **Pedido:** que no sea obligatorio al crear.

## 7. Clonado (`POST /client-service-plan/clone-to-client`)

Si el clonado copia baselines, debe copiar también `sessionDuration`, `intervalLength`, `unitOfTime` y `suggestedNumberOfRecordings`.

## 8. Migración de datos existentes

- **Time-sampling:** baselines sin los 3 campos. Rellenarlos con los valores del Type del item o dejarlos en `null`; el front usa el Type si vienen vacíos.
- **Rate, Duration, Latency e Interresponse time:** baselines guardados con un Period distinto a la Unit of time del item. El front ya los muestra y los guarda con la unidad del item. Si se quiere dejar la base consistente, actualizar su `periodCatalogId` al equivalente de la `unitOfTime` del item, **sin convertir** `value` ni `sessionDuration`.
- **Duration:** limpiar el `sessionDuration` que haya quedado guardado (opcional).

## 9. (Propuesta, por decidir) `value: null` = "sin registrar"

Hoy un día de baseline nuevo de Time-sampling se guarda con `value: 0`. Así no se distingue entre "todavía no se registró" y "se registró y hubo 0 ocurrencias". En la datasheet aparece con todos los intervalos en "−" y en la gráfica como **0%** antes de que alguien registre datos.

**Propuesta:** aceptar y devolver `value: null` en baselines (alta y `/baseline/values`) para indicar "sin registrar". El front ajustaría la datasheet y la gráfica para no dibujar esos días. Antes de implementarlo hay que confirmar con producto (Rosemary o Miriam).

---

## Checklist para backend

- [ ] Catálogo de Period con Seconds, Minutes, Hours y Days
- [ ] Reportes y cálculos de Rate, Duration, Latency e Interresponse time usan la `unitOfTime` del item
- [ ] `periodCatalogId` se persiste al cambiarlo
- [ ] `sessionDuration` obligatorio solo en Rate
- [ ] `suggestedNumberOfRecordings` opcional en Duration, Latency e Interresponse time (todos los `/level`)
- [ ] Time-sampling: persistir y devolver `intervalLength`, `unitOfTime` y `suggestedNumberOfRecordings` por baseline
- [ ] Time-sampling: validaciones de los 3 campos
- [ ] `/baseline/values` no pisa los 3 campos
- [ ] Time-sampling: `value` y `periodCatalogId` opcionales al crear
- [ ] Clonado copia los campos nuevos
- [ ] Migración de baselines existentes
- [ ] (Por decidir) `value: null` en baselines
