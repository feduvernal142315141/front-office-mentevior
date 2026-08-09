# Case Supervision Log — Plan de implementación (Front)

> Fecha: 2026-08-08
> Contrato backend: entregado 2026-08-07
> Módulo análogo: Monthly Supervision (`lib/modules/monthly-supervision`)

## ✅ Estado — implementado 2026-08-08

Las cinco fases están construidas y el build pasa. Se implementó **asumiendo** las
respuestas pendientes; cada supuesto está aislado en un solo archivo para que ajustarlo
sea una edición y no una refactorización.

| Pregunta | Supuesto tomado | Dónde se cambia |
| --- | --- | --- |
| Q1 · `MMyyyy` para rangos | ✅ **Confirmado**: el backend transforma a fecha antes de comparar | `lib/modules/case-supervision-log/utils/filters.ts` |
| Q2 · Prefijo de tipo | `monthYear` como String pelado; ids con `UUID_` | mismo archivo |
| Q3 · Listado sin horas | ✅ **Cerrado**: se queda sin horas. Se quitaron las columnas de horas y cumplimiento | `useCaseSupervisionLogTable.tsx` |
| Q4 · Duplicados | Se permiten; el front consulta antes y ofrece abrir el existente. **`PUT` confirmado inexistente; `DELETE` sin definir** | `use-create-case-supervision-log.ts` |
| Q5 · `units` vs horas | Se muestra lo que manda el backend, sin corregir | — (es del servidor) |
| Q6 · Permiso | `PermissionModule.SUPERVISION` | `ProtectedRoute.tsx`, `use-filtered-nav-items.ts` |
| Q7 · Filtros | Ver Q2 | `utils/filters.ts` |
| Q8 · Modality | La columna no se muestra en la UI | `CaseSupervisionAppointmentsTable.tsx` |

Refactors compartidos hechos de paso:

- `lib/utils/report-month.ts` — primitivas de mes, antes dentro de Monthly Supervision
- `components/custom/MonthPicker.tsx` — movido desde `monthly-supervisions/components`
- `lib/server/pdf-proxy.ts` — las cuatro rutas de preview ahora comparten el proxy

---

## 0. Qué es

Un reporte mensual por **cliente + provider** que mide qué porcentaje de las horas del
cliente fueron de supervisión, y dice si se cumple el mínimo del 10%.

El backend hace todo el cálculo. El front no computa horas ni porcentajes: elige el
trío (cliente, provider, mes), muestra lo que el backend devuelve, y persiste.

## 1. Diferencias con Monthly Supervision (leerlas antes de copiar código)

Se parecen, pero **no son el mismo flujo**. Estas cuatro diferencias cambian el diseño:

| | Monthly Supervision | Case Supervision Log |
| --- | --- | --- |
| Edición | `PUT` | **No existe** |
| Borrado | `DELETE` | **No existe** |
| Datos que aporta el usuario | Mode/Structure/Evaluation por fila, opciones, firmas | **Ninguno** — sólo el trío |
| Formato del mes | `yyyyMM` | **`MMyyyy`** |

La consecuencia grande: **este reporte no se edita ni se borra.** Un reporte mal creado
queda para siempre. Eso convierte a la pantalla de preparación en el único momento de
control, y hace que la confirmación previa a crear sea parte del producto, no un adorno.

## 2. Arquitectura

Se calca la estructura de Monthly Supervision, que ya resolvió estos problemas.

```
lib/types/case-supervision-log.types.ts
lib/modules/case-supervision-log/
  services/case-supervision-log.service.ts
  hooks/use-case-supervision-logs.ts            → listado
  hooks/use-case-supervision-log-by-id.ts       → detalle
  hooks/use-case-supervision-appointments.ts    → preparación
  hooks/use-create-case-supervision-log.ts      → alta
  utils/month-year.ts                           → yyyyMM ↔ MMyyyy

app/api/reports/case-supervision-log/preview/[fileName]/route.ts

app/(app)/case-supervision-log/
  page.tsx                                      → listado
  create/page.tsx
  [id]/page.tsx                                 → detalle read-only
  components/CaseSupervisionLogTable.tsx
  components/CaseSupervisionLogForm.tsx
  components/CaseSupervisionAppointmentsTable.tsx
  components/ComplianceSummary.tsx              → % + Met/Unmet
  hooks/useCaseSupervisionLogTable.tsx
```

### 2.1 El mes: `yyyyMM` adentro, `MMyyyy` en el borde

Igual que en Monthly Supervision, **adentro del front el mes se representa siempre como
`yyyyMM`** —ordenable y comparable— y la conversión al formato del API vive en un solo
archivo. Acá el API pide `MMyyyy`, que no es ninguna de las dos cosas (ver §5, Q1).

`lib/modules/monthly-supervision/utils/report-month.ts` ya tiene las primitivas puras
(parseo, split, formato largo, mes actual). **Propuesta:** extraerlas a
`lib/utils/report-month.ts` y dejar en cada módulo sólo su conversión de API. El
archivo viejo re-exporta, así no hay que tocar los llamadores.

### 2.2 El proxy del PDF

El endpoint es idéntico en forma al de Monthly Supervision: id en el **path**, respuesta
`{ fileBase64 }`. El proxy same-origin de `app/api/reports/monthly-supervision/preview/`
sirve tal cual cambiando la URL upstream.

Con éste van a ser **tres proxies casi idénticos** (appointment-note, clinical-monthly,
monthly-supervision). Son ~160 líneas cada uno de lógica de red delicada —cert
autofirmado, parseo de `Content-Disposition`, base64— duplicada tres veces. **Propuesta:**
extraer `lib/server/pdf-proxy.ts` y que cada ruta sea un `export const GET = pdfProxy({...})`
de cinco líneas. Se puede hacer en esta HU o dejar anotado.

## 3. Pantallas

### 3.1 Listado — `/case-supervision-log`

Tabla estándar (`CustomTable`) con el patrón de `useMonthlySupervisionTable`.

Columnas: Client · Supervisor · Period · Actions (Preview PDF, Ver detalle).

Filtros: rango de meses (desde/hasta), cliente, provider. Todos van por el contrato
dinámico `field__operator__value__concat` con `buildFilters`.

> ⚠️ **El listado no devuelve `totalsHours` ni `supervisionHours`** (§5, Q3). Sin eso la
> tabla no puede mostrar el porcentaje ni Met/Unmet — que es justamente el dato que
> hace útil al reporte. Monthly Supervision sí los devuelve en su listado.

### 3.2 Creación — `/case-supervision-log/create`

Dos etapas en una sola pantalla:

**Etapa 1 — Preparación.** Selects de cliente y provider + `MonthPicker`. Con los tres
completos se dispara `GET .../appointments` y se muestra:

- Los appointments del mes en una tabla read-only (fecha, horario, duración,
  característica)
- `totalsHours`, `supervisionHours`
- **El porcentaje y el Met/Unmet calculados en vivo** — hoy sólo existen en el PDF, pero
  es la información que decide si vale la pena crear el reporte. Se calcula con la misma
  fórmula del backend (`supervisionHours * 100 / totalsHours`, Met si ≥ 10%),
  protegiendo la división por cero.

**Etapa 2 — Confirmar y crear.** `POST` con `{ clientId, providerId, date }`.

Dos guardas propias de este flujo, por no haber update ni delete:

1. **Confirmación explícita** antes de crear, mostrando el trío y el resultado de
   cumplimiento. No es fricción gratuita: es irreversible.
2. **Chequeo de duplicado.** Antes de crear se consulta el listado filtrando por
   cliente + provider + mes. Si ya existe, se avisa y se ofrece abrir el existente en
   vez de crear otro. Pendiente de Q4: si el backend ya lo rechaza, esto se simplifica
   a mostrar bien el error.

Tras crear, **se navega al detalle releyendo con `GET /{id}`** en vez de asumir que lo
guardado es igual a lo que se vio. El contrato dice que el `POST` recalcula todo desde
cero, así que lo persistido es la única verdad.

### 3.3 Detalle — `/case-supervision-log/[id]`

Read-only, porque no hay update. Cabecera (cliente, supervisor, período), el resumen de
cumplimiento y la tabla de filas persistidas. Botón de Preview PDF.

Que sea de sólo lectura tiene que **verse**: sin campos deshabilitados que sugieran que
en algún momento se van a poder editar. Es un documento emitido, no un borrador.

### 3.4 Detalles de render

- `characteristic` **trae saltos de línea** (`"...Modification\nRBT Supervision"`). Va con
  `whitespace-pre-line`, o el `\n` se ve como espacio y las dos etiquetas quedan pegadas.
- `timeStart`/`timeEnd` vienen `HH:mm:ss` → formato 12h en pantalla.
- `duration` es número con 2 decimales.

## 4. Navegación y permisos

- `nav-items.ts` → bajo **Clinical Options**, después de "Monthly Supervisions".
- `use-filtered-nav-items.ts` y `ProtectedRoute.tsx` → mapear `/case-supervision-log`.
- Permiso: `PermissionModule.SUPERVISION` (`"supervision"`), según el contrato.
  **Ver Q6** — ese módulo ya está en uso para otra cosa.
- Gate de UX: `permission.create(SUPERVISION)` para el botón de crear,
  `permission.view(SUPERVISION)` para entrar. El control real lo aplica el backend.

## 5. Preguntas para backend

### Q1 🔴 `monthYear` en `MMyyyy` no es comparable para rangos

El contrato dice que `monthYear` soporta `GT`, `GTE`, `LT` y `LTE`. Pero en `MMyyyy`:

| Mes | `MMyyyy` | Como número |
| --- | --- | --- |
| Agosto 2026 | `082026` | 82.026 |
| Enero 2027 | `012027` | 12.027 |

Enero 2027 es **posterior** a agosto 2026, pero cualquier comparación textual o numérica
lo pone antes. Un filtro `monthYear__GTE__082026` dejaría fuera todo el año siguiente.

**Pregunta:** ¿el backend parsea `MMyyyy` a fecha antes de comparar, o compara el valor
crudo? Si es lo segundo, los rangos están rotos y el front no tiene forma de detectarlo
—devuelve menos filas, no un error—.

**Sugerencia:** aceptar también `yyyyMM`, que es el formato que ya usa Monthly
Supervision y que sí ordena solo.

### Q2 ¿Qué prefijo de tipo llevan los valores de filtro?

`buildFilters` del front tipa los valores según el campo: `UUID_...`, `Integer_...`,
`Date_...`, `Boolean_...`. El ejemplo del contrato (`monthYear__EQ__082026__AND`) va sin
prefijo.

**Pregunta:** confirmar por campo — ¿`monthYear` va como String pelado? ¿`clientId` y
`providerId` van con `UUID_` como en Monthly Supervision?

### Q3 El listado no trae las horas

`GET /reports/case-supervision-log` devuelve `id`, `clientId`, `clientName`, `providerId`,
`providerName` y `monthYear`. **No trae `totalsHours` ni `supervisionHours`.**

Sin ellos la tabla no puede mostrar el porcentaje de supervisión ni Met/Unmet, que es lo
que el usuario va a buscar en una lista de estos reportes. La alternativa es pedir el
detalle de cada fila, que son N requests para pintar una tabla.

**Pedido:** agregar `totalsHours` y `supervisionHours` al listado. Monthly Supervision ya
los devuelve en el suyo.

### Q4 ¿Se pueden crear duplicados?

No hay update ni delete. Si el analista crea dos veces el mismo (cliente, provider, mes):

**Pregunta:** ¿el backend rechaza con un error, sobrescribe, o quedan dos reportes?

Y la de fondo: **sin update ni delete, ¿cómo se corrige un reporte creado por error?**
Si la respuesta es "no se corrige", el front tiene que avisarlo antes de crear, y así
está planteado en §3.2. Si va a haber `DELETE` más adelante, conviene saberlo ahora.

### Q5 🔴 `duration` cae a `Appointment.units`, y una unidad no es una hora

El contrato dice: *"Si faltan las horas, se usa `Appointment.units`; si tampoco existe,
se devuelve 0"*.

En este sistema **1 unidad = 15 minutos** — está fijado en
`lib/utils/unit-calculation.ts:5` (*"Each billable unit = 15 minutes"*) y en
`lib/utils/prior-auth-utils.ts:72` (*"1 unit = 15 min → 4 units = 1 hour"*).

Si `units` se usa crudo como si fueran horas, un appointment de 4 unidades (1 hora) se
cuenta como **4 horas**: el `duration` queda 4× inflado y el porcentaje de supervisión
—y el Met/Unmet— salen mal.

**Pregunta:** ¿se divide `units / 4` para pasar a horas? Si no, hay que corregirlo.

### Q6 El permiso `supervision` ya está en uso para otra cosa

`PermissionModule.SUPERVISION = "supervision"` hoy protege
`/my-company/events/supervision`, que es el **catálogo de eventos de supervisión** —una
pantalla de configuración sin relación con este reporte—.

Si Case Supervision Log usa el mismo módulo, quien pueda configurar el catálogo podrá
crear reportes clínicos, y quien deba crear reportes tendrá acceso a la configuración de
la compañía. Son dos permisos distintos con un solo interruptor.

**Pregunta:** ¿es intencional, o corresponde un módulo propio (`case_supervision_log`)?

### Q7 ¿`supervisionHours` es realmente de supervisión?

La regla es *"suma únicamente los appointments cuyo `Appointment.providerId` coincide con
`providerId`"*. No filtra por billing code.

Si ese provider también dio sesiones directas al cliente (97153, por ejemplo), esas horas
entran en `supervisionHours` y **inflan el porcentaje de supervisión**. En Monthly
Supervision el conjunto sí está acotado a los 97155.

**Pregunta:** ¿debería filtrarse por códigos de supervisión, o el criterio "todo lo del
provider" es deliberado?

### Q8 `Case Supervision Modality` queda vacía

El contrato dice que la columna del PDF va vacía porque la propiedad no existe en
`CaseSupervisionLogAppointment`.

**Pregunta:** ¿se va a agregar? Mientras no exista, en la UI **no se muestra la columna**
en vez de mostrarla vacía — una columna siempre en blanco se lee como "falta cargar
esto", que es peor que no tenerla.

## 6. Fases de entrega

| Fase | Qué | Depende de |
| --- | --- | --- |
| 1 | Tipos, servicio, utils de mes, proxy PDF | — |
| 2 | Listado con filtros y paginación | Q1, Q2, Q3 |
| 3 | Preparación + creación | Q4, Q5, Q7 |
| 4 | Detalle read-only + PDF | — |
| 5 | Nav, permisos, estados vacíos y de error | Q6 |

Las fases 1 y 4 no dependen de ninguna respuesta y se pueden arrancar ya.
La 2 y la 3 se pueden construir asumiendo lo razonable, pero **Q1 y Q5 pueden hacer que
los números mostrados sean incorrectos sin que nada falle**, así que conviene confirmarlas
antes de dar la HU por terminada.
