# Service Log — Análisis de HU y plan de implementación (Front)

> Fecha: 2026-08-10
> Contrato backend: entregado 2026-08-10 (`POST /reports/service-log`, `GET /{id}`, `GET /{id}/preview`)
> Módulo análogo: Case Supervision Log (`lib/modules/case-supervision-log`) — mismo trío de endpoints, mismo proxy de PDF

## ✅ Estado — fases 1–4 implementadas 2026-08-10

**Q1 resuelta el mismo día:** backend entregó `GET /reports/service-log` (paginado, contrato
dinámico de filtros con `UUID_`/`Date_yyyy-MM-dd`, orden extra `createAt DESC`). Se
implementó el listado y se retiró la card provisional "Open by ID":

```
lib/modules/service-log/utils/filters.ts             → clientFilter/providerFilter (UUID_),
                                                       initDateFromFilter/endDateToFilter (Date_),
                                                       DEFAULT_ORDERS ["initDate__DESC"]
lib/modules/service-log/hooks/use-service-logs.ts    → listado con reloadKey
app/(app)/service-log/hooks/useServiceLogTable.tsx
app/(app)/service-log/components/ServiceLogTable.tsx → filtros From/To/Client/Provider,
                                                       columnas Client·Provider·Period·Generated·
                                                       Actions (Preview PDF, View); fila → detalle
```

Post-generación: como el POST solo encola, la página refresca el listado al toque y otra vez
a los 4s y 10s (`reloadKey`), para capturar lo que el async persiste. La semántica del rango
de filtros sigue el ejemplo del contrato: `initDate >= from` y `endDate <= to` (logs
contenidos en el rango).

Quedan abiertas Q2 (sin `status` de procesamiento — mitigado con los refetch diferidos),
Q3 (sin DELETE), Q4 (contador de filas no-LOCK), Q5 (caregiver del PDF vs `clientCaregiver`)
y Q6 (units→horas). Fase 5 (config compañía + cron) sigue pendiente de contrato.

**Q9 (pedido 2026-08-10, variante concreta de Q4):** agregar `billableServices` (contador de
detalles con AppointmentNote en Lock) al listado. Hoy una fila sin notas lockeadas muestra un
botón Preview PDF que revienta con el 422 de "no conserva appointments válidos" — el front no
puede anticiparlo sin pedir N detalles. Con el contador: badge `Ready`/`Pending notes` por
fila y botón de PDF deshabilitado con tooltip cuando es 0. Mientras tanto el 422 del preview
muestra el mensaje real del backend en una página legible (ajuste en `lib/server/pdf-proxy.ts`
2026-08-10: propaga `message`/`details` del error upstream y renderiza HTML en vez de JSON).

## Estado anterior — fases 1–3 implementadas 2026-08-10

Se implementó alineado al contrato tal como está (decisión del equipo). Archivos:

```
lib/types/service-log.types.ts
lib/modules/service-log/services/service-log.service.ts
lib/modules/service-log/hooks/use-service-log-by-id.ts
lib/modules/service-log/hooks/use-create-service-logs.ts
app/api/reports/service-log/preview/[fileName]/route.ts
app/(app)/service-log/page.tsx                       → generación + apertura por ID
app/(app)/service-log/[id]/page.tsx                  → detalle read-only
app/(app)/service-log/components/GenerateServiceLogsCard.tsx
app/(app)/service-log/components/ServiceLogServicesTable.tsx
```

Decisiones tomadas al implementar:

| Tema | Decisión | Dónde se cambia |
| --- | --- | --- |
| Sin listado (Q1) | La página principal ofrece generación (gated `service_log:CREATE`) + card "Open by ID" + aviso de que el listado llega con el endpoint | `app/(app)/service-log/page.tsx` |
| `initDate`/`endDate` timestamp UTC | Se recorta el prefijo `yyyy-MM-dd` como string (`toDateOnly`), sin `new Date()` | `service-log.service.ts` |
| Firma Base64 pelada | Se envuelve en `data:image/png;base64,` salvo que venga `http`/`data:` | `service-log.service.ts` (`toSignatureSrc`) |
| `imcomplete` | Se conserva el typo del contrato en el tipo y se pinta la fila `bg-red-50` + banner con contador | `ServiceLogServicesTable.tsx`, `[id]/page.tsx` |
| POST sin IDs | `createServiceLogs` devuelve `void`; éxito = toast "queued", 422 muestra el mensaje del backend tal cual | `use-create-service-logs.ts`, `GenerateServiceLogsCard.tsx` |
| Log "vacío" (notas sin lock, Q4) | Empty state explica que las filas aparecen al lockear las notas | `ServiceLogServicesTable.tsx` |

Pendiente: fase 4 (listado, bloqueada por Q1) y fase 5 (config + cron). Q5 y Q6 siguen
abiertas con backend (datos del servidor, no bloquean front).

## 0. Qué es

El Service Log es el respaldo por **cliente + provider + rango de fechas** que se envía a la
aseguradora para facturación. No requiere que el provider cargue nada: todo sale de datos ya
registrados (session notes lockeadas, horas, billing codes, firmas, PA).

## 1. Análisis de la HU: Opción 1 vs Opción 2 vs lo que el contrato realmente implementa

La HU plantea (1) rango configurado a nivel compañía con generación automática, o (2) rango
elegido por cada provider al generar. **El contrato entregado no es ninguna de las dos en su
forma literal — y eso es una decisión, no un hueco:**

- `POST /reports/service-log` recibe **solo `initDate`/`endDate`**. No recibe `providerId` ni
  `clientId`: genera de un tiro los logs de **todas** las combinaciones cliente/provider de la
  compañía en el rango. La generación es **centralizada y masiva**, no "cada provider genera
  el suyo". La Opción 2 literal (provider generando su propio log) no es implementable con
  este contrato, y operativamente es lo correcto según la propia HU.
- Lo que falta para la Opción 1 completa es (a) un endpoint de configuración del período por
  compañía y (b) un scheduler backend que dispare la generación al cierre de cada período.
  Ninguno existe todavía.

**Recomendación (alineada con la HU, que recomienda la Opción 1):**

| Etapa | Qué | Quién |
| --- | --- | --- |
| Ahora | Disparo manual por rango desde el front (rol admin/billing con `service_log:CREATE`) usando el contrato actual | Front |
| Siguiente | `GET/PUT /service-log-config` (frecuencia del período: weekly/biweekly/monthly + día de corte) + cron backend que hace lo mismo que el POST al cerrar el período | Backend define contrato; front hace la página de config |

La etapa "ahora" ya elimina el trabajo del provider por completo (el riesgo central de la
Opción 2). La automatización es incremental: el cron backend reutiliza el mismo POST.

Piezas del front que **ya existen** para esto: permiso `PermissionModule.SERVICE_LOG`
(`permissions-new.ts:20`) y `SERVICE_LOG_CONFIGURATION` (`:57`) con UUIDs registrados, ruta
`/service-log` cableada en nav/breadcrumbs/ProtectedRoute/proxy, y página placeholder
"Coming Soon" en `app/(app)/service-log/page.tsx`. Para la config existe el molde
`lib/modules/supervision-config/` (GET + upsert con `servicePutSilent`).

⚠️ **Permiso `CREATE`**: como el POST genera para toda la compañía, `service_log:CREATE` debe
asignarse solo a roles administrativos/billing en la matriz de roles. Un provider con CREATE
generaría (o fallaría por solapamiento) los logs de todos.

## 2. Arquitectura propuesta

Se calca Case Supervision Log, que ya resolvió el mismo shape de contrato (POST + GET by id +
preview, sin PUT/DELETE):

```
lib/types/service-log.types.ts                       → ServiceLogDetail, ServiceLogServiceRow,
                                                       CreateServiceLogDto, (ServiceLogListItem
                                                       cuando exista el listado)
lib/modules/service-log/
  services/service-log.service.ts                    → BASE_URL "/reports/service-log":
                                                       createServiceLogs({initDate,endDate}),
                                                       getServiceLogById (null en 404),
                                                       getServiceLogPdfUrl
  hooks/use-service-log-by-id.ts
  hooks/use-create-service-logs.ts
  hooks/use-service-logs.ts                          → bloqueado por Q1 (listado)

app/api/reports/service-log/preview/[fileName]/route.ts
  → copia del de case-supervision-log (17 líneas): id en path, `{fileBase64}` lo decodifica
    lib/server/pdf-proxy.ts sin cambios.

app/(app)/service-log/
  page.tsx                                           → reemplaza el "Coming Soon": listado
  [id]/page.tsx                                      → detalle read-only
  components/ServiceLogTable.tsx
  components/GenerateServiceLogModal.tsx             → rango + confirmación
  components/ServiceLogServicesTable.tsx             → filas con `imcomplete` en rojo
  hooks/useServiceLogTable.tsx
```

Fechas: el request usa `yyyy-MM-dd` (días, no meses) → dos `PremiumDatePicker` "From"/"To"
(patrón `ClinicalMonthlyTable.tsx:60-71`). No aplica `MonthRangePicker` salvo que operaciones
confirme que los períodos son siempre meses calendario.

## 3. Pantallas (nuestro estilo, no el del sistema de referencia)

### 3.1 Listado — `/service-log` (bloqueado por Q1)

`Card` de filtros (From/To + cliente + provider) → `CustomTable`.
Columnas: Period · Client · Provider · Total Hours · Actions (View, Preview PDF).
Botón "Generate Service Logs" gated con `permission.create(PermissionModule.SERVICE_LOG)`.

### 3.2 Generación

Modal con rango From/To + `useAlert().confirm` que diga explícitamente: *"Se generarán los
Service Logs de **todos** los clientes y providers con servicios entre X e Y"*. Tras el POST:

- `200 {accepted:true}` → toast "Generation queued — logs will appear shortly" + refetch del
  listado (con reintento corto, porque la persistencia es asíncrona).
- `422` → mostrar el mensaje del backend tal cual (rango inválido o solapado). El solapamiento
  rechaza **toda** la solicitud, no solo la combinación conflictiva — el mensaje debe dejarlo claro.

### 3.3 Detalle — `/service-log/[id]`

Read-only (no hay PUT), estilo `case-supervision-log/[id]/page.tsx`:

- Cards de cabecera: Recipient · Insurance (ya viene enmascarado) · Diagnosis · Provider ·
  Credentials · PA # · PA Start/End · Approved Units · Total Hours. Cuando el rango cruza
  varias autorizaciones los valores vienen concatenados con ` | ` — mostrar tal cual.
- Tabla de servicios: Date · Time In/Out · Hours · Units · Place of Service · Caregiver ·
  Signature/Validation. Fila con `imcomplete: true` → fondo `bg-red-50` (mismo criterio que el
  PDF). `caregiverSignatureImage` se renderiza como `<img>`; si la compañía usa checkmark se
  muestra el texto `caregiverValidation` ("Confirmed electronically" / "No signature").
- Botón Preview PDF → `DocumentViewer` con la URL del proxy.
- `initDate`/`endDate` del GET vienen como timestamp ISO UTC (`2026-01-01T00:00:00.000+00:00`)
  → formatear **en UTC** o recortar el `yyyy-MM-dd` del string; con `new Date()` + TZ local se
  muestra el día anterior.

### 3.4 Configuración de compañía (fase futura, cuando exista el contrato)

Página bajo `app/(app)/my-company/` (o en `template-documents/service-log`, que ya tiene el
permiso `SERVICE_LOG_CONFIGURATION`) con el patrón `supervision-config`: frecuencia del
período + día de corte. El cron es 100% backend; el front solo configura.

## 4. Preguntas / pedidos para backend

### Q1 🔴 No existe endpoint de listado — bloqueante

El POST devuelve solo `{accepted:true}` (sin IDs) y el GET es por ID. **El front no tiene
ninguna forma de descubrir qué Service Logs existen.** Sin un
`GET /reports/service-log` paginado (filtros: rango, `clientId`, `providerId`; columnas: id,
período, cliente, provider, totalHours) el módulo entero queda sin puerta de entrada.
Es el mismo shape que ya existe para `GET /reports/case-supervision-log`.

### Q2 🔴 Generación asíncrona sin señal de finalización ni de error

Los errores del procesamiento async "se registran en el log del backend; no modifican la
respuesta 200". El usuario nunca se entera si algo falló, y el front no sabe cuándo terminó
para refrescar. **Pedido mínimo:** que el listado (Q1) exista para poder hacer polling.
**Pedido ideal:** un `status` en la cabecera (`processing/completed/failed`) o contadores
de la última generación.

### Q3 Sin DELETE ni regeneración

Un rango generado por error (fechas equivocadas) queda para siempre y además **bloquea por
solapamiento** cualquier rango que lo cruce. ¿Habrá `DELETE` o regeneración? Si no, la
confirmación previa del front es el único control (igual que en Case Supervision Log) y hay
que decirlo en la UI.

### Q4 Filas ocultas por notas no-LOCK

El POST vincula appointments con nota en cualquier estado, pero el GET/preview solo devuelven
notas `LOCK`. Un log recién generado puede verse vacío (el preview responde `422` si no
conserva appointments válidos — manejar ese error con mensaje claro, no como fallo genérico).
**Pregunta:** ¿pueden devolver un contador de filas pendientes de lock (o las filas con un
flag), para que el detalle pueda decir "N servicios aún no facturables"? Hoy el front no puede
distinguir "log vacío" de "notas sin lockear".

### Q5 Contradicción en el nombre del caregiver: detalle vs PDF

El GET dice: *"El nombre del caregiver se toma de `AppointmentNote.clientCaregiver`; fallback
caregiver principal"* (correcto — es el firmante real que el front ya envía desde 2026-08-10).
Pero las reglas del PDF dicen: *"`Client/Caregiver Name` usa el caregiver principal; si no
existe, el primer activo"*. **Deberían ser la misma regla (la del GET)**; si el PDF ignora
`clientCaregiver`, imprime un firmante distinto al que validó la sesión.

### Q6 🔴 `Hours` con fallback a `Appointment.units` — 1 unidad = 15 minutos

Misma alerta que Q5 de Case Supervision Log (`docs/case-supervision-log-backend.md` §1):
en este sistema 1 unidad = 15 min (`lib/utils/unit-calculation.ts:5`). Si el fallback usa
`units` crudo como horas, una cita de 4 unidades (1 h) suma **4 h** al total que va a la
aseguradora. ¿Se divide entre 4?

### Q7 Naming: la cabecera se llama `SupervisionLog`

El front ya tiene un módulo `case-supervision-log` que consume `/reports/case-supervision-log`.
Que la cabecera del Service Log se persista en `supervision_log` no afecta al front, pero los
IDs **no** son intercambiables entre ambos módulos — solo dejarlo aclarado para soporte.

### Q8 Filtros del futuro listado

Cuando exista Q1: confirmar prefijos de tipo del contrato dinámico (`UUID_` para ids, formato
de fechas en filtros) — mismo asunto que Q2/Q7 de Case Supervision Log.

## 5. Fases de entrega

| Fase | Qué | Depende de |
| --- | --- | --- |
| 1 | Tipos, servicio, proxy PDF | — |
| 2 | Detalle read-only `/service-log/[id]` + filas `imcomplete` + Preview PDF | — (probable con IDs de QA) |
| 3 | Generación por rango (modal + confirm + manejo de 422) | Q3 (asumible) |
| 4 | Listado con filtros + polling post-generación | **Q1, Q2** |
| 5 | Config de compañía + generación automática | Contrato nuevo (`/service-log-config` + cron) |

Las fases 1–3 se pueden arrancar ya con el contrato actual. La 4 está **bloqueada** por Q1:
sin listado no hay pantalla principal. Q5 y Q6 no bloquean código del front (los datos son del
servidor) pero pueden hacer que el documento enviado a la aseguradora sea incorrecto — conviene
cerrarlas antes de dar la HU por terminada.
