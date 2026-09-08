# Pedidos de backend — 2026-09-05

> Base DEV: `https://api.dev.mentevior.com` · swagger `GET /v3/api-docs`
> Índice de la iteración: [`plans/iteracion-2026-09-05.md`](../plans/iteracion-2026-09-05.md)
>
> Cada punto trae **qué se pide**, **por qué el front no puede resolverlo solo**, un
> **contrato propuesto** (borrador, abierto a que backend lo ajuste) y **criterios de
> aceptación**. Los ids `B*` se usan en el índice y en los commits.

## Estado — 2026-09-08

**B1, B2 y B5 fueron entregados el 2026-09-07 y ya están adaptados en el front.** Lo que
llegó, cómo se adaptó, qué faltó y qué preguntas quedaron abiertas está en
[`docs/contratos-backend-2026-09-07.md`](./contratos-backend-2026-09-07.md).

B1 quedó **parcial**: llegó el modo de visualización pero no la etiqueta corta por cambio.
Los otros nueve puntos siguen sin respuesta.

## Resumen

| Id | Pedido | Endpoints tocados | Prioridad |
|---|---|---|---|
| [B1](#b1--modo-de-visualización-de-environmental-changes-en-el-chart) | Modo de visualización de environmental changes | `PATCH …/{id}/environmental-changes` (nuevo) | ⚠️ Entregado parcial 2026-09-07 |
| [B2](#b2--teaching-procedure-de-uno-a-muchos) | Varios teaching procedures por item | `PUT`/`GET` `…category-item/level` | ✅ Entregado 2026-09-07 |
| [B3](#b3--other-providers-asociados-al-cliente) | Other providers asociados al cliente | `/provider-on-file` (nuevos) | Alta |
| [B4](#b4--diagnóstico-del-assessment-visible-y-editable) | Diagnóstico del assessment visible y editable | `POST`/`PUT`/`GET` `/assessments` | Media |
| [B5](#b5--caregiver-denied-any-medications-at-this-time) | "Caregiver denied any medications at this time" | `POST`/`PUT`/`GET` `/assessments` | ✅ Entregado 2026-09-07 |
| [B6](#b6--providers-del-assessment-halados-del-service-plan) | Providers del assessment halados del service plan | `/assessments` + `…/assessment-data` | Alta |
| [B7](#b7--endpoint-agregado-de-gráficas-por-cliente) | Endpoint agregado de gráficas por cliente | nuevo `GET` | Media |
| [B8](#b8--other-services-terapias-activas) | Other services: terapias activas | `POST`/`PUT`/`GET` `/assessments` | Media |
| [B9](#b9--assessment-data-completo-del-service-plan) | `assessment-data` completo del service plan | `GET …/assessment-data` | Alta |
| [B10](#b10--service-log-vacío-visto-desde-el-ojito) | Service log que se ve vacío | `GET /reports/service-log/{id}` | Alta |
| [B11](#b11--service-log-que-refleje-los-cambios-de-la-nota) | Service log que refleje cambios de la nota | `/reports/service-log` | Alta |
| [B12](#b12--bloqueo-del-service-log-y-paso-a-billing) | Bloqueo del service log y paso a billing | `/reports/service-log`, `/batch-claims/service-logs` | Alta |

**Además, siguen abiertos** los tres pendientes de
[`docs/ajustes-backend-2026-09-03-hypothesized-function.md`](./ajustes-backend-2026-09-03-hypothesized-function.md),
sobre todo el primero: qué hace el backend cuando una clave **no viene** en el `PUT` del
nivel (¿preserva o pone en `null`?). Ese afecta a B1 y B2 directamente.

---

## B1 · Modo de visualización de environmental changes en el chart

**Pedido (L2).** Hoy los environmental changes salen de dos formas fijas y simultáneas:
líneas de fase punteadas en la gráfica, y un listado con fecha y nota debajo. Se pide que el
proveedor elija entre tres modos, incluido uno nuevo: una **etiqueta corta sobre la gráfica**
(ej. `MO`) con su significado explicado abajo (`MO = motivating operations`).

**Por qué no lo resuelve el front.** El modo y la etiqueta corta son configuración del
proveedor y tienen que sobrevivir a la recarga. `SyncClientServicePlanCategoryItemChartRequest`
hoy tiene `interval`, ejes, objetivos y `datasets` — no hay dónde guardarlos.

### Contrato propuesto

En el objeto `chart` del nivel (item **y** categoría), un bloque nuevo:

```json
{
  "chart": {
    "environmentalChanges": {
      "displayMode": "LINE",
      "showLegendBelow": true
    }
  }
}
```

`displayMode` (enum, nullable — `null` se comporta como `LINE` para no cambiar lo existente):

| Valor | Comportamiento |
|---|---|
| `LINE` | Línea de fase punteada en la fecha, como hoy |
| `LIST_ONLY` | No se dibuja en la gráfica; sólo el listado con su fecha |
| `LABEL` | Etiqueta corta sobre la gráfica + su explicación en la leyenda de abajo |

Y para el modo `LABEL`, cada environmental change necesita su etiqueta corta. Hoy el dato
viaja dentro del baseline como `environmentalChanges` (texto libre). Se propone sumarle un
campo hermano:

```json
{
  "baseline": [
    {
      "date": "2026-08-24",
      "value": 0,
      "environmentalChanges": "Motivating operations: caregiver started night shift",
      "environmentalChangesLabel": "MO"
    }
  ]
}
```

`environmentalChangesLabel`: string nullable, sugerido **máximo 6 caracteres**.

### Criterios de aceptación

- [ ] `GET …/level` devuelve `chart.environmentalChanges` y `baseline[].environmentalChangesLabel`.
- [ ] `PUT …/level` los persiste, y `null` los limpia.
- [ ] Un registro previo sin estos campos se lee sin error y se comporta como `LINE`.

### ✅ Entregado el 2026-09-07 — con una pieza faltante

Backend entregó el bloque `environmentalChanges` (`displayMode` + `showLegendBelow`) por
**item**, con default `LINE` / `true` para los registros nuevos y los existentes, leíble en
los dos GET y escribible por un `PATCH …/{id}/environmental-changes` propio. Que sea un
endpoint aparte resuelve de raíz el riesgo que teníamos: guardar el modo no puede pisar
nada del resto de la configuración del item.

**Falta `environmentalChangesLabel`.** El contrato no trae una etiqueta corta por cambio,
que es lo que pedía el ejemplo de Lidia (`MO` arriba, `motivating operations` abajo). Sin
ese campo el modo `LABEL` no puede mostrar texto escrito por el proveedor: el front lo
resolvió numerando los cambios en orden de fecha (`EC1`, `EC2`…) y explicándolos en el
listado de abajo. Es la forma pedida, no el contenido pedido.

Con el campo entregado, `environmentalChangeLabel()` en
`lib/constants/environmental-changes.ts` pasa a devolver el texto del proveedor y no hay
nada más que tocar.

### Preguntas

1. ~~¿El modo se configura por item o por categoría?~~ Resuelto: por item.
2. ¿La etiqueta corta se valida en backend (largo máximo) o la valida el front?
3. ¿El `PATCH` se puede llamar sobre un item que todavía no tiene nivel configurado?
4. Al clonar el service plan de la compañía al del cliente, ¿el modo se hereda o cada item
   del cliente arranca en el default?

---

## B2 · Teaching procedure: de uno a muchos

**Pedido (F2).** Que un item pueda tener más de un teaching procedure.

**Estado verificado.** En el swagger de dev, `SyncClientServicePlanCategoryItemLevelsCommand`
tiene `teachingProcedureId: string (uuid)` — uno solo. El catálogo ya existe
(`GET /teaching-procedure/catalog`).

### Contrato propuesto

```json
{
  "clientServicePlanCategoryItemId": "…",
  "teachingProcedureIds": ["uuid-1", "uuid-2"]
}
```

- `PUT …/level`: `teachingProcedureIds` reemplaza la colección completa (mismo criterio que
  `baseline` y `objetive`). Lista vacía = sin teaching procedures.
- `GET …/level`: devuelve `teachingProcedureIds` (y, si sirve para la UI,
  `teachingProcedures: [{ id, name }]` ya resuelto, para ahorrarnos el cruce con el catálogo).

**Compatibilidad.** Pedimos que `teachingProcedureId` (singular) se mantenga por un período
de transición, devolviendo el primero de la lista, para poder migrar el front sin corte. Si
se prefiere el corte limpio, avisar con qué fecha y lo coordinamos.

### Criterios de aceptación

- [x] Un item puede guardarse con 0, 1 o N teaching procedures.
- [x] Un item que hoy tiene uno se lee con una lista de un elemento.
- [ ] El PDF y cualquier reporte que hoy imprima el teaching procedure imprime todos.

### ✅ Entregado el 2026-09-07

Llegó completo, y con un extra que no habíamos pedido: **`hypothesizedFunction` también pasó
a ser lista**, en el item y en el Assessment. Los GET devuelven los teaching procedures
**resueltos** (`{ id, name }`), lo que nos ahorra el cruce contra el catálogo.

Detalle de la adaptación y preguntas abiertas en
[`docs/contratos-backend-2026-09-07.md`](./contratos-backend-2026-09-07.md#b2--teaching-procedures-e-hypothesized-functions).

⚠️ **Aviso para otros consumidores:** el singular `teachingProcedureId` se sigue aceptando en
el request pero **desapareció del response**. Una pantalla no migrada lee vacío y, al
guardar, borra los teaching procedures del item. Nuestro front está migrado entero; conviene
avisar al backoffice y a cualquier otro cliente del API.

---

## B3 · Other providers asociados al cliente

**Pedido (F8).** Una lista de "Other providers" debajo de Providers, en el cliente.

**Estado.** `provider-on-file` es un CRUD de **compañía** (`GET/POST/PUT/DELETE
/provider-on-file`). La única relación con un cliente hoy es indirecta, a través del
diagnóstico (`providerIds` en el modal de diagnóstico). No hay forma de listar "los other
providers de este cliente".

### Contrato propuesto

```
GET    /client/{clientId}/provider-on-file        → lista (id, name, specialty, contact…)
POST   /client/{clientId}/provider-on-file        → { providerOnFileIds: [ "uuid", … ] }
DELETE /client/{clientId}/provider-on-file/{id}
```

El `POST` con reemplazo total de la colección nos deja usar el mismo patrón de asignación que
ya tiene `Step9Providers` con los providers internos.

Cada fila del `GET` debería traer, como mínimo:

```json
{
  "id": "…",
  "providerOnFileId": "…",
  "name": "Jane Doe",
  "specialty": "Speech Language Pathology",
  "contactInformation": "…"
}
```

### Criterios de aceptación

- [ ] Se puede asociar y desasociar un provider on file a un cliente.
- [ ] El listado trae la especialidad resuelta, no sólo el id.
- [ ] Desasociar del cliente **no** borra el provider on file de la compañía.

### Pregunta

¿La asociación por diagnóstico que ya existe queda como está, o el diagnóstico pasa a elegir
entre los other providers **del cliente** en vez de los de la compañía?

---

## B4 · Diagnóstico del assessment: visible y editable

**Pedido (F9.2).** Que el proveedor **vea en pantalla** el diagnóstico dentro de Medical
History y pueda modificarlo si hace falta. Hoy el front muestra un aviso —"se captura
automáticamente cuando se cree el documento"— que se va a eliminar.

**Estado.** `medicalHistoryPrimaryDiagnosisName` es un snapshot de sólo lectura que el
backend arma al crear el assessment; en create el front no tiene nada que mostrar.

### Contrato propuesto

1. `GET /client-service-plan/client/{clientId}/assessment-data` (o el endpoint del perfil que
   backend prefiera) devuelve el diagnóstico primario **actual** del cliente, para poder
   precargarlo antes de guardar:

```json
{ "primaryDiagnosis": { "id": "…", "code": "F84.0", "name": "Autistic disorder" } }
```

2. `POST` / `PUT /assessments` aceptan el campo, con la misma semántica que quedó en
   `hypothesizedFunction`: si el request trae valor, ese gana en el snapshot del assessment;
   si no, el backend copia el del cliente. Modificarlo en el assessment **no** cambia el
   diagnóstico del cliente.

```json
{ "medicalHistoryPrimaryDiagnosisId": "…", "medicalHistoryPrimaryDiagnosisName": "…" }
```

### Criterios de aceptación

- [ ] Al crear, la pantalla puede mostrar el diagnóstico actual del cliente antes de guardar.
- [ ] El proveedor puede sobrescribirlo para ese assessment.
- [ ] El expediente del cliente no cambia por editarlo acá.

### Pregunta

¿Es un texto libre o tiene que quedar amarrado al catálogo de diagnósticos? Cambia si el
front pinta un input o un combobox contra `diagnoses`.

---

## B5 · "Caregiver denied any medications at this time"

**Pedido (F9.3).** Un checkmark con ese texto en Current Medications: si está marcado, **ese**
es el texto que sale en el PDF. Además, poder escribir algo libre.

**Estado.** `currentMedications` es una lista de `{ name, dosage, frequency, details }`. No
hay forma de expresar "no tiene medicación" distinta de "la lista está vacía", y el PDF no
tiene de dónde sacar la frase.

### Contrato propuesto

```json
{
  "currentMedicationsDenied": true,
  "currentMedicationsNote": "Caregiver denied any medications at this time",
  "currentMedications": []
}
```

- `currentMedicationsDenied`: boolean, default `false`.
- `currentMedicationsNote`: string nullable — el texto libre que pidió el proveedor. Cuando
  `currentMedicationsDenied` es `true` y la nota viene vacía, el backend imprime el texto
  estándar en el PDF (mismo criterio que ya se usa con las narrativas del assessment, que
  ante `null` imprimen el texto por defecto).

**Regla de impresión pedida:** con `currentMedicationsDenied: true` el PDF imprime la frase y
**no** imprime la tabla de medicaciones, aunque la lista traiga filas.

### Criterios de aceptación

- [x] Se puede guardar un assessment con `currentMedicationsDenied: true` y lista vacía.
- [x] El PDF imprime la frase en ese caso.
- [x] Con `false`, el PDF imprime la tabla como hoy.

### ✅ Entregado el 2026-09-07

Llegó tal como se pidió, y resuelve el riesgo que habíamos marcado —el estado contradictorio
de `denied: true` con la lista llena— del lado de la impresión: el PDF ignora las filas. Como
el backend lo contempla, el front **no las borra**: borrarlas sólo serviría para que alguien
que marca la casilla por error pierda lo que tipeó.

Extra no pedido: el assessment automático del appointment **97151** arranca con
`denied: true` si el cliente no tiene medicación activa.

Detalle y preguntas abiertas en
[`docs/contratos-backend-2026-09-07.md`](./contratos-backend-2026-09-07.md#b5--current-medications-denied).

---

## B6 · Providers del assessment halados del service plan

**Pedido (F9.6).** En la sección Providers del assessment tiene que salir el **BCBA halado
del service plan**, y sumarse los **other providers con sus especialidades**.

**Estado.** La sección es 100% manual: `providerFiles` es una lista de
`{ type, name, contactIformation }` que el proveedor tipea a mano cada vez.

### Contrato propuesto

Que el assessment traiga, además de lo tipeado, los providers **resueltos**:

1. En `GET /client-service-plan/client/{clientId}/assessment-data`, un bloque nuevo con los
   providers ya asignados al service plan del cliente:

```json
{
  "providers": [
    { "id": "…", "name": "Jane Doe", "credentials": "BCBA", "isPrimary": true,  "source": "SERVICE_PLAN" },
    { "id": "…", "name": "John Roe", "specialty": "Speech Therapy", "source": "PROVIDER_ON_FILE" }
  ]
}
```

2. `GET /assessments/{id}` devuelve esa misma lista dentro del snapshot, para que el PDF y la
   pantalla de edición muestren lo que había al momento del assessment.

`source` distingue las dos procedencias, así el front puede marcarlas visualmente y sólo
dejar borrar las que se agregaron a mano.

**Depende de [B3](#b3--other-providers-asociados-al-cliente):** sin la asociación
cliente ↔ provider-on-file no hay de dónde sacar los `PROVIDER_ON_FILE`.

### Criterios de aceptación

- [ ] Al crear un assessment, la sección Providers ya viene con el BCBA del service plan.
- [ ] Los other providers del cliente aparecen con su especialidad.
- [ ] El proveedor puede sumar filas manuales, como hoy.
- [ ] El PDF imprime las tres procedencias.

---

## B7 · Endpoint agregado de gráficas por cliente

**Pedido (L3).** Una pantalla con **todas** las gráficas del cliente —maladaptive,
replacements y caregivers— en una sola vista.

**Por qué se pide.** Con lo que hay hoy, armar esa pantalla obliga a encadenar:
service plan → categorías → items por categoría → **configuración de nivel por item**. Para
un cliente con 15 items son ~18 requests sólo para pintar la pantalla. El front puede
mitigarlo cargando por categoría y bajo demanda, pero es un parche.

### Contrato propuesto

```
GET /client-service-plan/client/{clientId}/charts?from=yyyy-MM-dd&to=yyyy-MM-dd
```

```json
{
  "categories": [
    {
      "id": "…",
      "name": "Maladaptive Behaviors",
      "items": [
        {
          "id": "…",
          "name": "Aggression",
          "collectionMethod": "Frequency",
          "chart": { },
          "baseline": [ ],
          "objetive": [ ],
          "dataCollection": [ { "date": "2026-08-24", "value": 3 } ]
        }
      ]
    }
  ]
}
```

Es, en la práctica, el `GET …/level` de cada item agrupado por categoría, más los valores
recolectados del rango.

**Actualización 2026-09-05 — la pantalla ya está construida y esto es lo que le falta.** Se
resolvió con `getClientServicePlanCategoryItems` por categoría (1 + N_categorías requests),
así que el endpoint agregado bajó de prioridad para el volumen. Pero hay dos tipos de item que
**no se pueden dibujar** con lo que hay:

| Tipo | Qué le falta al front |
|---|---|
| **Rate** | La duración de cada sesión. Hoy vive en los appointments y la pantalla de captura la cruza a mano; el endpoint de valores recolectados sólo devuelve un número por fecha |
| **Percentage of Opportunities** | Los ensayos uno por uno (yes/no). El valor recolectado es un número, no la serie de trials |

Si el endpoint agregado devuelve, por item, lo que su gráfica necesita —minutos de sesión para
Rate, trials para Percentage— esos items dejan de mandar al usuario a Data Collection.

Bonus: hoy `ReadOnlyItemChart` y `useChartData` piden **dos veces** los valores del mismo rango
(es el mismo doble fetch que ya hace el panel de la session note). Con el agregado desaparece.

### Criterios de aceptación

- [ ] Una sola llamada devuelve lo necesario para dibujar todas las gráficas del cliente.
- [ ] Acepta filtro de rango de fechas.
- [ ] Un cliente sin service plan activo responde 200 con lista vacía, no 404.

**Prioridad real:** media. Si backend no llega, el front igual entrega la pantalla con la
carga por categoría; este endpoint la vuelve instantánea.

---

## B8 · Other services: terapias activas

**Pedido (F10).** La sección Other Services tiene que dejar de ser sólo el historial de ABA
previo. El niño puede tener otras terapias activas:

> Speech therapy (yes/no), occupational therapy (yes/no), physical therapy (yes/no),
> feeding therapy (yes/no), other: espacio para escribir, más otro espacio para el nombre
> del lugar.

**Estado.** Sólo existen `previousAbaTherapy` (string Yes/No) y `previousAgencyName`.

### Contrato propuesto

```json
{
  "otherServicesSpeechTherapy": true,
  "otherServicesOccupationalTherapy": false,
  "otherServicesPhysicalTherapy": false,
  "otherServicesFeedingTherapy": false,
  "otherServicesOther": "Music therapy 1×/week",
  "otherServicesFacilityName": "Sunrise Pediatric Center"
}
```

Los cuatro booleanos con default `false`; los dos strings nullable. Los campos actuales
(`previousAbaTherapy`, `previousAgencyName`) **no se tocan**: siguen siendo el historial de
ABA previo, que es otra cosa.

### Criterios de aceptación

- [ ] Los seis campos viajan en `POST`/`PUT` y vuelven en `GET /assessments/{id}`.
- [ ] El PDF los imprime en la sección Other Services.
- [ ] Un assessment viejo sin estos campos se lee sin error.

### Pregunta

¿El nombre del lugar es uno solo para todas las terapias, o uno por terapia? El pedido dice
"otro espacio para poner nombre de lugar" en singular, así que lo modelamos como uno.

---

## B9 · `assessment-data` completo del service plan

**Pedido (F11).** *"Falta halar todo del service plan. Toda la información que está ahí debe
salir en la pantalla para ser modificada y en el PDF."*

**Estado.** `GET /client-service-plan/client/{clientId}/assessment-data` devuelve hoy, por
item, sólo `id`, `name` y —desde el 2026-09-03— `hypothesizedFunction`.

### Qué necesitamos por item

| Campo | Para qué |
|---|---|
| `topography` / descripción | Contexto clínico del item en la pantalla y en el PDF |
| `collectionMethod` | Hoy el front lo resuelve pegándole a **otros** endpoints del service plan sólo para decidir si muestra Intensity (ver `use-client-item-collection-methods.ts`). Con esto se elimina ese rodeo |
| `teachingProcedures` | Pedido F2 / B2 |
| `objetiveType` y objetivos (STO) | Que el assessment refleje las metas vigentes |
| `baseline` | Idem |
| `intensityDescription` configurada, si existe | Ver [D3](../plans/iteracion-2026-09-05-definiciones.md#d3--descripción-de-la-intensidad-f12) |

Y a nivel categoría, su nombre y tipo de colección.

### Contrato propuesto

Extender el item de `assessment-data` a:

```json
{
  "id": "…",
  "name": "Aggression",
  "topography": "Physical aggression toward others",
  "collectionMethod": "Frequency",
  "hypothesizedFunction": "ESCAPE",
  "objetiveType": "Mastery",
  "teachingProcedures": [ { "id": "…", "name": "Task Analysis" } ],
  "baseline": [ { "date": "2026-08-24", "value": 0, "period": "Day" } ],
  "objetive":  [ { "name": "STO#1 …", "startDate": "…", "estimatedEndDate": "…" } ]
}
```

**Beneficio inmediato:** elimina el rodeo que hoy hace `useClientItemCollectionMethods` — tres
llamadas al service plan del cliente sólo para saber el método de colección de cada item.

### Criterios de aceptación

- [ ] Una sola llamada alcanza para pintar la sección Categories & Items completa.
- [ ] `GET /assessments/{id}` conserva en el snapshot lo que se imprimió.
- [ ] El endpoint sigue respondiendo 200 con lista vacía si el cliente no tiene SP activo.

### Pregunta abierta del 2026-09-03, todavía sin responder

`/category-items` y `/assessment-data` siguen los dos publicados en dev
(`getCategoriesWithItemsByClient` y `getAssessmentDataByClient`) y **ninguno está tipado en el
swagger** (`type: object`). ¿`/category-items` queda deprecado? ¿`assessment-data` devuelve
siempre `{ categories: [...] }`?

---

## B10 · Service log vacío visto desde el ojito

**Reporte (L4a).** *"Se fue a ver el service log y no se pudo ver. Se genera, pero cuando se
entra por el ícono del ojito no sale nada."*

**Lo que descartamos del lado del front.** El detalle está implementado
(`app/(app)/service-log/[id]/page.tsx`), el `GET /reports/service-log/{id}` está mapeado, y el
permiso de `/service-log/{id}` resuelve al **mismo** módulo que el listado
(`resolveRouteModule` hace match por prefijo), así que quien ve la lista puede entrar al
detalle. No es gating de rol.

**Hipótesis principal.** El service log se generó **sin servicios**, porque sólo entran las
session notes en estado **Lock**. Está documentado en
[`plans/service-log.md`](../plans/service-log.md) §Q9: un service log sin notas lockeadas
queda vacío y su preview responde 422 ("no conserva appointments válidos").

### Lo que pedimos

1. **Confirmar la hipótesis** contra un caso concreto (nos comprometemos a mandar cliente +
   rango + id del service log).
2. **`billableServices`** en el listado — el contador de detalles con AppointmentNote en Lock.
   Ya está pedido en `plans/service-log.md` §Q9 y sigue abierto. Con eso el front puede
   mostrar un badge `Ready` / `Pending notes` por fila y no dejar entrar a un documento vacío
   sin explicar por qué.
3. Que `GET /reports/service-log/{id}` de un log sin servicios responda **200 con
   `services: []`** y no un error, para poder pintar un empty state honesto.

### Criterios de aceptación

- [ ] El listado indica por fila cuántos servicios facturables tiene el service log.
- [ ] Entrar a un service log sin servicios muestra un mensaje claro, no una pantalla en blanco.

---

## B11 · Service log que refleje los cambios de la nota

**Pedido (L4b).** *"Que si se hace un cambio en la nota —fecha, lugar de servicio, etc.— el
service log se actualice."*

**Por qué es de backend.** El service log es un documento generado y persistido por el
backend a partir de las notas. El front sólo dispara la generación (`POST /reports/service-log`)
y lee. Hoy no hay ningún mecanismo de refresco.

### Opciones a evaluar por backend

| Opción | Ventaja | Riesgo |
|---|---|---|
| **A — Regeneración automática** al editar una nota incluida en un service log | Nada que recordar | ¿Qué pasa si el service log ya se facturó? |
| **B — Marcarlo como desactualizado** (`isOutdated: true`) y ofrecer un botón "Regenerate" | Control explícito del proveedor | Suma un estado nuevo al contrato |
| **C — Bloquear la edición de la nota** una vez incluida en un service log | Consistencia total | Muy rígido; choca con la realidad clínica |

**Preferencia del front: B.** Es la que se puede reflejar bien en la UI y no toca documentos
ya facturados. Necesitaríamos `isOutdated` en el listado y en el detalle, y un endpoint de
regeneración.

**Relación con [B12](#b12--bloqueo-del-service-log-y-paso-a-billing):** un service log
bloqueado no debería poder regenerarse.

---

## B12 · Bloqueo del service log y paso a billing

**Pedido (L5).** *"Que pase a billing cuando el service log esté bloqueado."*

**Estado.** Batch Claims ya consume service logs (`GET /batch-claims/service-logs`, contrato
2026-08-14), pero el service log **no tiene ningún estado de bloqueo** hoy — ni en el
contrato ni en el front. La única validación existente es que un service log activo no puede
estar en dos BatchClaims activos.

### Lo que hace falta definir

1. **Qué significa "bloqueado".** ¿Es una acción explícita del proveedor, como el Lock de las
   session notes, o es automático cuando todas sus notas están en Lock?
2. **El campo.** `status` o `locked` en `GET /reports/service-log` y en el detalle.
3. **La acción**, si es explícita: `PUT /reports/service-log/{id}/lock`.
4. **El filtro.** `GET /batch-claims/service-logs` tendría que devolver **sólo** los
   bloqueados, o aceptar el estado como query param.

### Contrato propuesto (asumiendo bloqueo explícito)

```
GET  /reports/service-log            → cada fila con "status": "OPEN" | "LOCKED"
PUT  /reports/service-log/{id}/lock  → 200
GET  /batch-claims/service-logs      → sólo status LOCKED
```

### Criterios de aceptación

- [ ] Un service log abierto no aparece como elegible en Batch Claims.
- [ ] Bloquear un service log lo hace elegible.
- [ ] Un service log bloqueado no se puede regenerar (ver B11).

---

## Cómo respondernos

Alcanza con contestar por punto: **aceptado / con cambios / no aplica**, más las respuestas a
las preguntas abiertas. Con eso ajustamos el front y actualizamos este documento y
[`plans/iteracion-2026-09-05.md`](../plans/iteracion-2026-09-05.md).

Lo que más nos desbloquea, en orden: **B9**, **B2**, **B3**, **B12**.
