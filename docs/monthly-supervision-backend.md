# Monthly Supervision — Requerimientos Backend

> Fecha: 2026-08-05
> Referencia: contrato **"Monthly Supervision API Contract"** (2026-08-04)
> Módulo front: `/monthly-supervisions` (hoy placeholder "Coming Soon")

## Contexto

El contrato del 2026-08-04 resuelve bien el camino de **crear un reporte y generar
su PDF**. Lo que no cubre es la HU completa:

> *"Vista general del Monthly Supervisions. Tener en cuenta que se debe filtrar por
> rango de Fecha, Providers, Cliente y Estatus del documento. De cada cliente/Provider
> se debe crear un Monthly Supervisions dado un rango de fecha, y lo crean los
> analistas, pero los RBT lo deben poder visualizar. […] dada una fecha el sistema
> debe ser capaz de jalar todos los summary que estén dentro de ese rango de fecha y
> permitir dicha edición de summary."*

Este documento lista lo que falta, ordenado por bloqueo. **R1 a R6 son bloqueantes**:
sin ellos la HU no se puede cerrar. El resto son ajustes que evitan retrabajo.

## Resumen

| # | Qué falta | Estado al 2026-08-05 |
| --- | --- | --- |
| **R1** | `GET /reports/monthly-supervision` (listado paginado con filtros) | ✅ **Entregado** |
| **R2** | Catálogos de `documentOption` y `appliedOption` | ⚠️ Contrato definido; **confirmar si ya responden** |
| **R3** | Detalle completo para edición | 🔴 **Sin resolver — pérdida silenciosa de datos al editar** |
| **R4** | `status` del documento | ⬜ **Descartado por ahora** (decisión de Frank, 2026-08-05) |
| **R5** | `DELETE` / desactivar | ✅ **Entregado** |
| **R6** | Edición del `summary` | ⬜ **Descartado** — el summary se muestra, no se edita |
| **R7** | Ajustes menores del contrato | 🟡 Abierto, + el cambio de formato de fecha (ver §8) |

> **R3 es el único bloqueante que queda**, y con el listado y el `DELETE` ya
> entregados pasó a ser más urgente: ahora existe el camino que lleva al usuario a
> abrir un reporte viejo y editarlo.

---

## R1. Listado paginado con filtros ✅ entregado (2026-08-05)

> **Resuelto.** `GET /reports/monthly-supervision` responde paginado, con
> `clientName` y `providerName` resueltos, `pagination.total`, página 0-based y
> filtros por mes/año (`eq` y rango `gte`/`lte`), cliente y provider. El handler
> acota siempre por la compañía del usuario y los filtros del front no pueden
> reemplazar esa condición — que era el punto de PHI que preocupaba.
>
> Compatible con `buildFilters` sin tocar nada: `type: "number"` produce
> `requestedReportMonthYear__EQ__Integer_202608__AND`.
>
> Sólo quedan dos detalles menores, en §R7: el filtro se llama
> `requestedReportMonthYear` pero el campo del response es `requestedReportDate`, y
> el listado no trae `supervisorName`.

*(Pedido original, conservado como referencia del contrato.)*

**No existía `GET /reports/monthly-supervision`.** La HU pide una vista general con
filtros por rango de fecha, Provider, Cliente y Estatus. No había forma de listar
los reportes, ni de saber si ya existe uno para un cliente/provider/mes.

Se pide el **mismo contrato que `GET /reports/clinical-monthly`**, que el front ya
consume y sabe filtrar (`useClinicalMonthlyTable.tsx`):

```
GET /reports/monthly-supervision
  ?filters=reportDate__GTE__Date_2026-02-01
  &filters=reportDate__LTE__Date_2026-04-30
  &filters=clientId__EQ__UUID_1dbf6f4e-...
  &filters=providerId__EQ__UUID_11111111-...
  &filters=status__EQ__DRAFT
  &orders=...&page=0&pageSize=10
```

Response paginado:

```json
{
  "entities": [
    {
      "id": "00000000-0000-0000-0000-000000000000",
      "clientId": "...",
      "clientName": "Aaron Correa",
      "providerId": "...",
      "providerName": "Yayli Gonzalez Mora",
      "supervisorName": "Miriam Moreno-Duarry",
      "requestedReportDate": "February 2026",
      "reportDate": "2026-02-01",
      "totalHoursWorked": 107,
      "supervisedHours": 12,
      "status": "DRAFT",
      "createAt": "2026-02-28T10:00:00.000Z",
      "active": true
    }
  ],
  "pagination": { "totalAmount": 42 }
}
```

Puntos a confirmar, aprendidos de Clinical Monthly:

- **`reportDate` tipado como fecha.** `requestedReportDate` es un String libre
  (`"February 2026"`): no se puede filtrar por rango ni ordenar cronológicamente.
  Hace falta **un campo `Date` derivado del mismo mes** para que el filtro funcione.
- **Formato del filtro de fecha**: `Date_yyyy-MM-dd` con guion bajo, igual que
  `UUID_`. Ya soportado por `lib/utils/query-filters.ts`.
- **Paginación 0-based**, como el resto del front.
- **`pagination.totalAmount`** (o `total`): sin él la paginación queda coja.
- **`providerName` y `supervisorName` en el listado.** El provider es el
  *supervisee*; sin su nombre la tabla solo puede mostrar UUIDs.
- **Scope por rol (RBT).** La HU dice que el RBT visualiza. El listado debe filtrar
  por rol: el RBT solo ve las supervisiones donde él es el supervisee (o de sus
  clientes asignados). **El gate del front es UX, no seguridad — sin scope en
  backend hay exposición de PHI.**

---

## R2. Catálogos de opciones ⚠️ contrato definido — confirmar si responden

El contrato del 2026-08-05 define los dos endpoints, con los datos semilla y sus
UUIDs:

```
GET /monthly-supervision-document-option/catalog
GET /monthly-supervision-applied-option/catalog
```

Respuesta paginada estándar (`entities[]` + `pagination`), con `id`, `code`, `name` y
`sortOrder`; `pageSize=0` devuelve todo, ordenado por `sortOrder` y luego `name`.
Compatible con el patrón de catálogos que ya usa el front —los servicios existentes
aceptan tanto array pelado como `entities`/`items`/`data`.

### ❓ Lo único a confirmar

El propio documento dice: *"Actualmente el backend **no expone endpoints HTTP** para
consultar estos dos catálogos. Los endpoints descritos a continuación representan el
**contrato requerido**"*.

Eso se lee como especificación de lo que falta, no como entrega — aunque los UUIDs
concretos sugieren que las tablas ya están cargadas. **¿Responden hoy o siguen
pendientes?** Si dan `404`, el formulario no puede pintar los checkboxes.

### Notas de implementación

- El texto libre `otherAppliedOption` se habilita al marcar la opción cuyo
  **`code` es `OTHER`**. El front se apoya en `code` y no en el UUID ni en el `name`:
  es el único de los tres que el contrato promete estable.
- `sortOrder` manda el orden en pantalla y en el PDF; el front no reordena.

---

## R3. Detalle completo para edición 🔴

`GET /reports/monthly-supervision/{id}/appointments` devuelve la misma estructura que
el endpoint por cliente/mes. **Le faltan todos los campos propios de la cabecera**, y
eso rompe la edición de forma silenciosa:

> ⚠️ El `PUT` **elimina lógicamente los appointments anteriores y reemplaza las
> opciones**. Si el front no puede precargar lo que hay guardado, cualquier edición
> —aunque solo cambie una firma— **borra los checks y las evaluaciones** del reporte.
> No falla, no avisa: se pierden los datos.

Campos que faltan en el response:

| Campo | Por qué se necesita |
| --- | --- |
| `clientId`, `providerId` | El `PUT` los exige en el body; el front debe reenviarlos |
| `requestedReportDate` | Precargar el selector de mes |
| `otherAppliedOption` | Precargar el texto libre |
| `documentOptionCatalogIds[]` | Precargar los checks marcados |
| `appliedOptionCatalogIds[]` | Ídem |
| `appointments[].mode` / `.structure` / `.evaluation` | Precargar la tabla; sin esto se pierden al guardar |
| `supervisorSign`, `superviseeSign` | Las notas dicen que salen de `MonthlySupervision`, pero **no están en el JSON de ejemplo** — ¿se devuelven o no? |
| `status` | Para bloquear la edición si el documento ya está firmado/cerrado |

Response esperado:

```json
{
  "id": "...",
  "clientId": "...",
  "clientName": "Aaron Correa",
  "providerId": "...",
  "requestedReportDate": "February 2026",
  "status": "DRAFT",
  "otherAppliedOption": "",
  "documentOptionCatalogIds": ["..."],
  "appliedOptionCatalogIds": ["..."],
  "supervisor": { "name": "Miriam Moreno-Duarry", "credentials": "LMHC MH14619" },
  "supervisee": { "name": "Yayli Gonzalez Mora" },
  "totalHoursWorked": 107,
  "supervisedHours": 12,
  "supervisorSign": "data:image/png;base64,...",
  "superviseeSign": "data:image/png;base64,...",
  "appointments": [
    {
      "appointmentId": "...",
      "date": "2026-02-06",
      "duration": "3",
      "summary": "During the supervision session...",
      "mode": "Face-to-Face",
      "structure": "Individual",
      "evaluation": "Satisfactory"
    }
  ]
}
```

> **Alternativa aceptable:** si prefieren no tocar `/{id}/appointments`, sirve un
> `GET /reports/monthly-supervision/{id}` con la cabecera completa; el front haría
> las dos llamadas. Preferimos un solo endpoint.

---

## R4. Estatus del documento ⬜ descartado por ahora

> **Decisión (Frank, 2026-08-05): no va en esta entrega**, igual que en Clinical
> Monthly. **No hace falta ningún cambio de backend por este punto.**

La HU menciona filtrar por estatus del documento, pero el concepto no existe todavía
en ningún módulo: el modelo solo tiene `active: boolean`. Se posterga hasta que se
defina **un enum único para todo el sistema** —Clinical Monthly, Monthly Supervision
y Session Note—, en vez de inventar tres vocabularios distintos.

El filtro de Estatus **no se muestra** en la tabla. Queda detrás de un flag
(`STATUS_FILTER_ENABLED`, mismo patrón que `useClinicalMonthlyTable.tsx`), así que
encenderlo el día que exista es una línea.

Cuando se retome, hará falta: el enum y sus transiciones, quién cambia cada estado,
que venga en el listado y sea filtrable, y si un estado final bloquea el `PUT`.

---

## R5. Borrar / desactivar ✅ entregado (2026-08-05)

> **Resuelto.** `DELETE /reports/monthly-supervision/{monthlySupervisionId}` hace
> borrado lógico de la cabecera **y de sus appointments**, valida compañía y exige
> permiso `DELETE` sobre `monthly_supervisions`. Devuelve `true` pelado — mismo
> patrón que el `POST` con el UUID, ya resuelto en Clinical Monthly con `extractId`.

**Sigue abierto — unicidad:** nada impide crear dos reportes para el mismo
cliente + provider + mes. ¿El backend lo rechaza, o se permiten varios? Con `DELETE`
ya es manejable, pero conviene saberlo para decidir si el front avisa antes de crear
un duplicado.

---

## R6. El `summary` ⬜ descartado — es de sólo lectura

> **Decisión (Frank, 2026-08-05): el summary se muestra, no se edita.**
> **No hace falta ningún cambio de backend por este punto.**

El `summary` de cada appointment sale de
`AppointmentNote97155Detail.activeDirectionNarrative` y ya viene en los dos endpoints
de appointments. El formulario lo presenta como texto de sólo lectura junto a cada
supervisión; lo editable por reporte sigue siendo `mode`, `structure` y `evaluation`.

Esto cierra el punto sin tocar la session note, que era el riesgo del camino
alternativo: escribir sobre una nota `close`/`lock` (`useNoteStatus.ts`) y tener que
respetar la validación de narrativa de 150–400 palabras (`narrative-length.ts`).

### ⚠️ Una consecuencia que conviene tener presente

Al no persistirse en `MonthlySupervision`, el summary del PDF se resuelve **en vivo
desde la session note**. Si alguien edita el `activeDirectionNarrative` después, el
PDF de un reporte ya generado **cambia retroactivamente**.

Para un documento clínico firmado eso puede no ser deseable. Si se quiere congelar el
texto al momento de crear el reporte, la solución es guardar una copia en
`MonthlySupervisionAppointment` —sin exponerla como editable—. **A decidir con
Miriam**; no bloquea la implementación.

---

## R7. Ajustes del contrato 🟡

### 🔴 7.0 — El formato de `requestedReportDate` cambió y ahora hay tres

Es lo más urgente de esta lista: **nadie declaró el cambio y afecta al `POST`.**

| Dónde | Formato | Fuente |
| --- | --- | --- |
| `GET /reports/monthly-supervision/appointments` (query) | `monthYear=02/2026` | contrato 08-04 |
| `POST` / `PUT` (body) | `"February 2026"` | contrato 08-04 |
| Listado y sus filtros | `202608` / `Integer_202608` | contrato 08-05 |

El listado dice: *"El backend guarda y filtra `requestedReportDate` con ese mismo
valor, por ejemplo `202608`"*. Si el almacenamiento pasó a `yyyyMM`, **el `POST`
también cambió y el contrato del 08-04 quedó desactualizado**.

**Pregunta bloqueante: ¿qué acepta hoy el `POST`/`PUT` en `requestedReportDate`?**
Si el front sigue mandando `"February 2026"` y el backend guarda `yyyyMM`, o lo
parsea en silencio, o el registro **queda invisible para el filtro que acaban de
construir**.

**Propuesta: `yyyyMM` numérico en todo el módulo**, incluido el query param de
`/appointments` (`monthYear=202602` en vez de `02/2026`). Un solo formato, ordenable
y filtrable; el front lo formatea a "August 2026" para mostrar.

### 7.1 Rango vs mes único — ✅ aclarado

El listado filtra por rango con `gte`/`lte` sobre `requestedReportMonthYear`, así que
**el rango es del filtro, no del reporte**: cada Monthly Supervision sigue siendo de
un mes. Confirmar que esa es la intención (Clinical Monthly, en cambio, sí abarca
hasta 12 meses por reporte).

3. **Naming inconsistente**: el `GET` devuelve `appointments[].id`, el `POST` espera
   `appointments[].appointmentId`. Unificar en `appointmentId`.

4. **`duration: "3"`** viene como String y sin unidad declarada. ¿Horas? Si es
   numérico, mandarlo como número; si tiene decimales (`"3.67"`), decirlo.

5. **`mode`, `structure` y `evaluation` son strings libres** y el PDF los imprime tal
   cual. Un typo llega al documento clínico. ¿Son un catálogo, un enum cerrado, o
   texto libre a propósito? Si son cerrados, pedimos el catálogo o los valores
   válidos.

6. **`totalHoursWorked` y `supervisedHours` los calcula el backend pero el front los
   envía** en el `POST`/`PUT`. ¿Gana el body o el cálculo del servidor? ¿Son
   editables a mano por el analista, o el front debe reenviar siempre lo que recibió?

7. **Códigos `55` y `55HN`.** La HU habla de *"session note con código 55 o 55HN"*; el
   contrato dice solo `CPT 97155`. **Confirmar que el filtro incluye los
   modificadores** (`HN`, `XP`). El front rutea por `billingCode.includes("97155")`,
   así que `97155-HN` ya cae en el formulario correcto — pero el backend tiene que
   incluirlos en el universo de `supervisedHours` y de `appointments[]`.

8. **`supervisorId` no se envía en el `POST`.** Se asume que el backend lo resuelve
   del token (como en Clinical Monthly). Confirmar — y ojo que acá `providerId` es el
   **supervisee**, no el supervisor.

9. **`supervisorSign` / `superviseeSign` en `GET /appointments`** (el de
   cliente/mes, antes de que exista el reporte): ¿de dónde salen? ¿Son las firmas
   guardadas del perfil de cada usuario? Si es así, el front las precarga; si no,
   deberían venir `null`.

10. **PDF por path param.** `GET /{id}/preview` pone el id en el path, mientras
    Clinical Monthly lo pone en query. No es un problema —el front adapta su proxy—
    pero se menciona porque obliga a una ruta nueva en vez de reusar la existente.

11. **El filtro no se llama como el campo.** Se filtra por
    `requestedReportMonthYear` pero la respuesta trae `requestedReportDate`. Dos
    nombres para el mismo dato; se presta a filtrar por el equivocado y recibir un
    `400`. *(Nuevo con el contrato del 08-05.)*

12. **`requestedReportDate` viaja como String** (`"202608"`) pero se filtra como
    `Integer_202608`. Elegir un tipo. *(Nuevo con el contrato del 08-05.)*

13. **El listado no trae `supervisorName`.** Trae el provider, que es el
    **supervisee**. Si la tabla debe decir quién supervisó, hace falta pedirlo.
    *(Nuevo con el contrato del 08-05.)*

---

## Criterios de aceptación

- [x] El listado devuelve reportes paginados y filtra correctamente por rango de
      fecha, cliente y provider. *(Estatus queda fuera — ver R4.)*
- [ ] Un RBT autenticado solo recibe las supervisiones que le corresponden, tanto en
      el listado como al pedir el PDF.
- [ ] Los dos catálogos de opciones responden con `id`, `code`, `name` y `sortOrder`.
- [ ] **Abrir un reporte guardado, cambiar solo una firma y guardar conserva intactos
      los checks, las evaluaciones y los appointments.** ← el que falta, R3.
- [ ] Un reporte creado con el formato de fecha que manda el front aparece al
      filtrarlo por su propio mes. *(Cierra la ambigüedad de §7.0.)*
- [x] Un reporte borrado desaparece del listado.
- [ ] Un appointment `97155-HN` aparece en `appointments[]` y suma en
      `supervisedHours`.

---

## Estado del front — 2026-08-05

El módulo está **implementado y compilando** contra este contrato:

| Pieza | Dónde |
| --- | --- |
| Tipos | `lib/types/monthly-supervision.types.ts` |
| Servicios + normalización | `lib/modules/monthly-supervision/services/` |
| Formato del período | `lib/modules/monthly-supervision/utils/report-month.ts` |
| Hooks | `lib/modules/monthly-supervision/hooks/` |
| Listado, formulario, PDF | `app/(app)/monthly-supervisions/` |
| Proxy del PDF | `app/api/reports/monthly-supervision/preview/[fileName]/route.ts` |

Cómo reacciona a lo que sigue abierto:

- **R3 (detalle incompleto):** al abrir un reporte guardado, el front comprueba si
  llegaron los ids del cliente/provider, las opciones marcadas y el
  mode/structure/evaluation. **Si falta algo, la edición queda bloqueada** con un
  aviso explícito y sólo se ofrece ver el PDF. Es una guarda que se apaga sola: en
  cuanto el `GET` devuelva esos campos, el formulario se habilita sin tocar código.
- **R2 (catálogos):** si los endpoints no responden, el formulario muestra un aviso
  y el resto del reporte sigue siendo usable.
- **§7.0 (formato de fecha):** todo pasa por `report-month.ts`. Hoy manda `yyyyMM`;
  si confirman que el `POST` espera `"February 2026"`, se cambia una constante.
- **R7 #5 (mode/structure/evaluation):** son selects, no texto libre, con los
  valores de `lib/constants/monthly-supervision-options.ts` — **pendientes de
  confirmar con Miriam**. Un valor que llegue del backend y no esté en la lista se
  conserva, no se pisa.

---

## Referencias

- Contrato original: "Monthly Supervision API Contract" (2026-08-04)
- Contrato de catálogos, listado y delete: "Endpoints de catálogos de Monthly
  Supervision" (2026-08-05)
- `plans/SCRUM-163-clinical-monthly.md` — GAP **B2** (estatus) queda postergado en
  ambos módulos; **B6b** (delete) y **B9** (scope) ya resueltos acá y todavía
  abiertos en Clinical Monthly
- `docs/clinical-monthly-summary-backend.md` — precedente de campo `summary` único
- `lib/utils/query-filters.ts` — formato de filtros que consume el front
- `app/(app)/session-note/hooks/useNoteStatus.ts` — estados de la nota 97155
- `lib/utils/narrative-length.ts` — validación de las narrativas (150–400 palabras)
