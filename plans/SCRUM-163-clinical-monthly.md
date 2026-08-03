# SCRUM-163: Clinical Monthly — Análisis y Plan de Implementación

> **Jira:** SCRUM-163 | **Fecha:** 2026-08-02 | **Estado:** EN CURSO
> **Contrato backend:** "Clinical Monthly - Endpoints actualizados" (2026-08-02)
>
> **Avance:** Fases 0, 1, 2, 3, 4 y 5 ✅ — HU funcionalmente completa.
> Pendiente sólo de backend: estatus del documento (B2), `DELETE` (B6b) y scope por rol del RBT (B9).

---

## 1. Qué pide la HU

- Vista general de **Clinical Monthly** con filtros por **rango de fecha, Providers, Cliente y Estatus del documento**.
- Se crea **un Clinical Monthly por cliente/provider dado un rango de fecha**.
- **Los analistas lo crean**; **los RBT solo lo visualizan**.

## 2. Qué hay hoy en el front

| Pieza | Estado |
| --- | --- |
| `app/(app)/clinical-monthly/page.tsx` | Placeholder "Coming Soon" (35 líneas) |
| `app/(app)/template-documents/clinical-monthly/page.tsx` | Placeholder "Coming Soon" |
| `PermissionModule.CLINICAL_MONTHLY` (`lib/utils/permissions-new.ts:18`) | ✅ Ya existe |
| Ruta protegida (`components/layout/ProtectedRoute.tsx:15`) | ✅ Ya cableada |
| Nav item (`components/layout/nav-items.ts:51`) | ✅ Ya cableado |
| Breadcrumb (`components/layout/Breadcrumbs.tsx:20`) | ✅ Ya cableado |
| Módulo `lib/modules/clinical-monthly/` | ❌ No existe |
| `lib/types/clinical-monthly.types.ts` | ❌ No existe |

**Conclusión:** el andamiaje de navegación/permisos está listo; falta todo el módulo funcional.

## 3. Qué da el backend (contrato actual)

*(actualizado con los cambios del 2026-08-02)*

| Endpoint | Qué hace |
| --- | --- |
| `POST /reports/clinical-monthly/preview` | **Crea** el registro + textos por item. Devuelve **el UUID pelado**, ya no el PDF |
| `PUT /reports/clinical-monthly/{id}` | Actualiza cabecera y **sincroniza** items (crea / actualiza / borra lógico) |
| `GET /reports/clinical-monthly/{id}` | Detalle completo: cabecera + `months[]` + `categories[].items[]` con textos, valores, objetivos y `chartPoints` |
| `GET /reports/clinical-monthly/preview?clinicalMonthlyId=` | Genera el PDF de un registro existente |
| `GET /reports/clinical-monthly` | Listado paginado (`filters`, `orders`, `page`, `pageSize`) |

Response del listado (sin cambios):
```json
{ "id","clientId","clientName","startDate","endDate","createAt","active" }
```

Validaciones que impone el backend en POST y PUT — replicadas en el front para no gastar round-trips (`lib/modules/clinical-monthly/utils/month-range.ts`):
- `clientId`, `startMonthYear`, `endMonthYear` obligatorios, rango en `MM/yyyy`
- `endMonthYear >= startMonthYear` y **máximo 12 meses**
- `items[].clientServicePlanCategoryItemId` obligatorio y **sin repetir**
- cada item debe pertenecer al Client Service Plan **activo** del reporte

### ⚠️ Consecuencia del cambio: no hay preview sin persistir

El PDF ahora sólo se puede pedir de un registro que ya existe. El formulario tiene que
**crear una vez con `POST` y actualizar con `PUT`** en los guardados siguientes; si se
llamara al `POST` en cada "Preview" se acumularía un registro por click. Eso es
exactamente lo que resuelve `useSaveClinicalMonthly` (guarda el id en un `ref` para que
dos clicks seguidos no creen dos registros).

---

## 4. GAPS — estado al 2026-08-02

### ✅ Resueltos por el cambio del 2026-08-02
- **B4** (cada preview creaba un registro) → el `POST` ya no genera PDF y existe `PUT` para actualizar. Con crear-una-vez-y-actualizar no se ensucia la base.
- **B5** (sin detalle) → `GET /reports/clinical-monthly/{id}` devuelve todo, incluso `chartPoints` y objetivos.
- **B6** (sin edición) → hay `PUT`. *(Sigue sin haber `DELETE`.)*
- **B10** (origen de los items) → el detalle ya trae `categories[].items[]` resueltos. Ver la nota de abajo sobre el formulario de creación.

### ✅ B1. RESUELTO — el provider es el usuario logueado
Confirmado por Frank y por el ejemplo de filtros de backend. El `ClinicalMonthly` **no tiene provider propio**:
- **Al crear**: el provider es el usuario logueado, lo resuelve el backend desde el token. Por eso `SaveClinicalMonthlyDto` **no lleva** `providerId` y el formulario **no** tiene selector de Provider.
- **Al filtrar**: "por Provider" significa quedarse con los reportes de los clientes que tienen ese provider asignado, navegando la relación:
  ```
  client.clientProviders.providerId__RELATED_EQ__UUID_<providerId>
  ```
  Mismo patrón que ya usa `useSessionNotesTable.tsx` con `appointment.providerId`.
- **Unicidad**: al no haber provider en el modelo, el reporte es por **cliente + período**, no por cliente+provider+período.

**Queda un pedido menor:** el listado no devuelve `providerName` (el detalle sí). La columna Provider de la tabla está implementada de forma adaptativa — aparece sola en cuanto el backend empiece a mandarlo, sin tocar código.

### 🔴 B2. No existe `status` (Estatus del documento)
El listado solo trae `active: boolean`. La HU pide filtrar por **estatus del documento**.

**Pedir:** enum de estatus + transiciones. Propuesta alineada a los otros documentos del sistema: `DRAFT` → `COMPLETED` → `SIGNED` (o el set que ya use Session Note). Debe venir en el listado y ser filtrable.

### 🟡 B3. `total` en `pagination` — probablemente ya resuelto
El doc del contrato muestra `pagination` sin `total`, pero `lib/modules/clients/services/clients.service.ts:70` lee `pagination.totalAmount ?? pagination.total`, así que **el backend ya manda el total con otro nombre** en al menos un listado.

El servicio acepta las tres formas (`totalAmount`, `total`, y como último recurso `entities.length`). **Sólo hay que confirmar cuál usa este endpoint** — si no manda ninguna, la paginación queda coja.

### 🟠 B6b. Sigue sin haber `DELETE`
Existe el flag `active` y el `PUT` hace borrado lógico **de los items**, pero no hay forma de desactivar o eliminar el reporte completo. Sin eso, un Clinical Monthly creado por error queda para siempre en el listado.

### ✅ B7. RESUELTO — formato de filtros confirmado
Ejemplo que pasó backend:
```
GET /reports/clinical-monthly
  ?filters=startDate__gte__Date_2026-05-01
  &filters=endDate__lte__Date_2026-07-31
  &filters=clientId__eq__UUID_1dbf6f4e-...
  &filters=client.clientProviders.providerId__related_eq__UUID_11111111-...
  &page=1&pageSize=10
```
Confirma que el rango aplica sobre el **período del reporte** (`startDate`/`endDate`), no sobre `createAt`.

**⚠️ El valor de fecha va como `Date_yyyy-MM-dd` con guion bajo**, igual que `UUID_`, `Integer_` y `Boolean_`. `lib/utils/query-filters.ts` no tenía tipo `date`, así que se agregó (`type: "date"` → `Date_...`).

**Detalle a verificar aparte:** `useSessionNotesTable.tsx:60` manda `Date:${fecha}` con **dos puntos**, contra otro endpoint. O ese endpoint acepta ambos, o ese filtro de fecha no está filtrando de verdad. Vale la pena probarlo — no lo toqué porque queda fuera de esta HU.

*(Nota menor: el campo de creación se llama `createAt`, sin la "d". Ya está mapeado así.)*

### 🟡 B8. Base de paginación — a confirmar
El ejemplo usa `page=1` y el doc dice default `1`, pero **todos** los módulos del front envían 0-based (`page - 1`, ver `useClientsTable.tsx:93`, `useClinicalDocumentsTable.tsx:45`) contra este mismo backend. Se dejó 0-based por consistencia. **Confirmar**: si en realidad es 1-based, la primera página se pierde.

### 🟡 B9. Visibilidad del RBT
La HU dice que el RBT **visualiza**. Hay que confirmar que:
- `GET /reports/clinical-monthly` scope-ea por rol (el RBT ve solo los CM de sus clientes asignados), y
- `GET /reports/clinical-monthly/preview` **autoriza** al RBT a generar el PDF.
Si el backend no scope-ea, el RBT vería CM de clientes que no le corresponden — riesgo de PHI.

### ✅ B10b. RESUELTO — sin tocar backend
El detalle resuelve `categories[].items[]`, pero sólo de un reporte que ya existe; para crear uno nuevo hacían falta los items **antes**. Se resolvió leyéndolos del Service Plan del cliente con endpoints que ya existían (ver Fase 3). **No hace falta el endpoint de resolución** que se iba a pedir, ni crear un registro al abrir el formulario.

---

## 5. Alineación del TOKEN (revisión pedida)

Backend ahora expone `accessTokenExpiresIn` y `refreshTokenExpiresIn` **en login y en refresh**, como **fecha ISO absoluta** (`2026-08-01T15:30:00.000+00:00`).

### Veredicto: ✅ compatible — no rompe nada hoy

- `parseExpiresIn()` (`auth.store.ts:53`) no matchea el regex de duración y cae al `Date.parse(raw)` → devuelve el timestamp absoluto correcto. El sufijo `+00:00` se parsea bien.
- En login (`auth.store.ts:471`) se lee `refreshTokenExpiresIn` primero → ✅ nombre nuevo.
- En refresh (`auth.store.ts:311`) se lee `refreshExpiresIn` primero y `refreshTokenExpiresIn` como fallback → funciona, pero el orden quedó invertido respecto del contrato nuevo.

### Ajustes recomendados (todos pequeños, sin riesgo)

**T1 — Invertir la prioridad en refresh.** `refreshTokenExpiresIn` pasa a ser el canónico y `refreshExpiresIn` el legacy. Mismo cambio en `RefreshTokenResponse` (`auth.types.ts:56-63`): hoy los tipos declaran como requerido el nombre viejo.

**T2 — Usar `accessTokenExpiresIn` como red de seguridad.** Hoy `accessTokenExpiresAt` sale **solo** del `exp` del JWT (`getTokenExpiration`, `auth.store.ts:93`). Si `jwtDecode` falla devuelve `0` → `accessTokenRefreshAt = 0` → el worker nunca programa renovación → **la sesión muere en silencio**, justo el bug que se arregló en `a0f0801`. Con el campo nuevo hay fallback real:
```ts
const accessTokenExpiresAt =
  getTokenExpiration(data.accessToken) || (parseExpiresIn(data.accessTokenExpiresIn) ?? 0)
```

**T3 — `computeRefreshAt` sin depender de `iat`.** Hoy calcula la vida del token con `iat` del JWT (`auth.store.ts:112`); si no viene, cae al margen fijo de 5 min. Con `accessTokenExpiresIn` se puede derivar la vida real sin `iat`.

**T4 — ⚠️ Riesgo NUEVO: desfase de reloj del cliente.** Al pasar de duraciones relativas a **timestamps absolutos del servidor**, todas las comparaciones contra `Date.now()` quedan expuestas al reloj del equipo del usuario. Con un reloj adelantado:
- `evaluateSession()` (`auth.store.ts:426`) ve `refreshTokenExpiresAt <= now` → `endSession()`
- `onRehydrateStorage` (`auth.store.ts:726`) hace lo mismo al recargar

…y el usuario queda fuera **sin que el backend haya rechazado nada**. Antes, con duraciones relativas, esto no podía pasar.

**Mitigación:** calcular el desfase en login usando el `iat` del JWT (que es el "ahora" del servidor) y descontarlo en las comparaciones:
```ts
const skewMs = Date.now() - decoded.iat * 1000   // >0 = reloj del cliente adelantado
```
Y como cinturón de seguridad: **no cerrar sesión solo por el timestamp**. Intentar el refresh y cerrar únicamente ante `401`/`403` del backend — que es la única fuente de verdad.

**T5 — `passwordExpirationDate` no se usa.** El login lo devuelve y el front lo ignora (no está ni en `LoginResponse`). Oportunidad: avisar "tu contraseña vence en X días". **¿Entra en esta HU o va aparte?**

---

## 6. Plan de implementación

Fases 0, 1, 2 y el proxy de PDF ya están hechas. La Fase 3 quedó desbloqueada por el cambio del 2026-08-02 salvo por B1 (provider) y B10b (fuente de items al crear).

### FASE 0 — Alineación del token ✅ HECHO
- `lib/types/auth.types.ts`: canónicos `accessTokenExpiresIn`/`refreshTokenExpiresIn` en **login y refresh**, legacy marcados `@deprecated`, `passwordExpirationDate?` agregado, `clockSkewMs` en `TokenState`.
- `lib/store/auth.store.ts`:
  - **T1** — refresh ahora lee `refreshTokenExpiresIn` primero.
  - **T2** — `resolveAccessTokenExpiresAt()`: `exp` del JWT y, si falla, `accessTokenExpiresIn`. Se acabó el `0` que dejaba la sesión sin renovación programada.
  - **T3** — `computeRefreshAt()` sin `iat` usa la vida restante en vez del margen fijo de 5 min.
  - **T4** — `measureClockSkew()` + `serverNow()`: el desfase se mide con el `iat` del JWT en login/refresh (umbral 60s) y se descuenta en **todas** las comparaciones. Al worker se le mandan las fechas convertidas a reloj del equipo, porque él compara contra su propio `Date.now()`.
  - Ya **no se cierra sesión por reloj**: `evaluateSession` y el `SESSION_EXPIRED` del worker intentan renovar, y sólo `endSession()` ante 401/403. `onRehydrateStorage` ya no hace logout preventivo.
  - `cookieMaxAgeFor()` también corrige el desfase (con el reloj adelantado calculaba una cookie más corta y mandaba a `/login-error` con la sesión viva).
- **Verificación pendiente en navegador:** login → consola muestra `[AuthStore] Sesión activa` con las 3 fechas en hora local; adelantar el reloj del equipo 2h y confirmar que **no** cierra sesión sola (debe loguear el aviso de desfase).

### FASE 1 — Tipos + módulo de servicios ✅ HECHO
- `lib/types/clinical-monthly.types.ts`: listado, `SaveClinicalMonthlyDto` (sirve para POST y PUT) y todo el árbol del detalle (`ClinicalMonthlyDetail`, `categories[].items[]`, `values`, `objectives`, `chartPoints`, `months`).
- `lib/modules/clinical-monthly/services/clinical-monthly.service.ts`: `getClinicalMonthlies`, `getClinicalMonthlyById`, `createClinicalMonthly`, `updateClinicalMonthly`, `getClinicalMonthlyPdfUrl`.
  - `extractId()` porque el POST/PUT devuelven el **UUID pelado**, no un objeto.
- `lib/modules/clinical-monthly/hooks/`: `use-clinical-monthlies`, `use-clinical-monthly-by-id`, `use-save-clinical-monthly`.
- `lib/modules/clinical-monthly/utils/month-range.ts`: valida `MM/yyyy`, orden, tope de 12 meses e items repetidos antes de llamar al backend.
- **Blindaje ante B3:** si `pagination.total` no viene, `totalCount` cae a `entities.length` para no dejar la tabla vacía.

### FASE 2 — Listado con filtros ✅ HECHO *(el core de la HU)*
- `app/(app)/clinical-monthly/page.tsx` → reemplazado el placeholder por la vista real.
- `app/(app)/clinical-monthly/components/ClinicalMonthlyTable.tsx` sobre `components/custom/CustomTable.tsx`.
- `app/(app)/clinical-monthly/hooks/useClinicalMonthlyTable.tsx`, calcado de `useSessionNotesTable.tsx`:
  - Rango de fecha → `PremiumDatePicker` ×2 → `startDate__GTE__Date_...` / `endDate__LTE__Date_...`
  - Cliente → `useClientsByLoggedUser` → `clientId__EQ__UUID_...`
  - Provider → `useUsers` → `client.clientProviders.providerId__RELATED_EQ__UUID_...` ✅ **funcionando**
  - Estatus → `status__EQ__...` *(sigue bloqueado por B2)*
  - Todo con `buildFilters` + `FilterOperator` (`lib/utils/query-filters.ts`).
- **Degradación elegante:** sólo el select de Estatus queda deshabilitado con tooltip "pendiente de backend"; se activa con `STATUS_FILTER_ENABLED`.
- Columnas: Cliente, **Provider *(adaptativa: aparece cuando el listado empiece a devolver `providerName`)***, Período (`startDate`–`endDate`), Estatus, Creado (`createAt`), Acciones (Ver PDF).

### FASE 3 — Creación y edición ✅ HECHO
- `app/(app)/clinical-monthly/create/page.tsx` y `[id]/edit/page.tsx`, ambas sobre `ClinicalMonthlyForm.tsx`.
- **Cliente + rango `MM/yyyy`** con `MonthYearPicker` (mes y año por separado; un date picker de día sugeriría una precisión que el reporte no tiene). **Sin selector de Provider**: es el usuario logueado.
- **Origen de los items — B10b resuelto sin tocar backend.** `useClientServicePlanItems` encadena lo que ya existía:
  1. `getClientServicePlanByClientId(clientId)` → Service Plan del cliente
  2. `getClientServicePlanCategories(servicePlanId)` → categorías
  3. `getClientServicePlanCategoryItems(categoryId)` → items *(en paralelo por categoría)*

  El `id` del item mapeado **es** el `clientServicePlanCategoryItemId` que piden POST y PUT — confirmado en `client-service-plan.service.ts:171`. Así el formulario se arma **sin crear ningún registro**, que era justamente el riesgo del camino (a).
- Por cada item, dos `FloatingTextarea` agrupados por categoría en `CollapsableCard`.
- **"Save & Preview PDF"** guarda (`POST` la primera vez, `PUT` después) y abre el visor; ya no existe preview sin persistir.
- Validaciones de `month-range.ts` antes de llamar (formato, orden, tope de 12 meses, items repetidos).
- **Al editar**: el detalle precarga rango y textos, pero la estructura de items sale igual del Service Plan — que es lo que el backend valida. El cliente queda bloqueado.
- **Sólo se envían los items con algún texto.** Como el `PUT` borra lógicamente lo que no venga, vaciar los dos campos equivale a quitar ese item del reporte.

### FASE 4 — PDF (ver / descargar) ✅ HECHO
- `app/api/reports/clinical-monthly/preview/[fileName]/route.ts` — mismo patrón que `appointment-note` (proxy same-origin con `node:https` por el certificado autofirmado, y desempaquetado de `{ fileBase64 }`); cambia sólo el query param a `clinicalMonthlyId`.
- Visor con `components/custom/DocumentViewer.tsx`, abierto desde la fila o el botón de la tabla.
- El cambio del 2026-08-02 simplificó esto: como el POST ya no devuelve base64, **toda** la generación de PDF pasa por el proxy y no hace falta convertir base64 a object URL en el cliente.

### FASE 5 — Permisos y rol RBT ✅ HECHO *(salvo B9)*
- `ProtectedRoute` resuelve por el **primer segmento** de la ruta, así que `/clinical-monthly/create` y `/clinical-monthly/[id]/edit` ya quedaron cubiertas por `CLINICAL_MONTHLY` sin tocar nada.
- Gate por `usePermission()`: `create(...)` muestra el botón "New Clinical Monthly"; `edit(...)` muestra el lápiz de cada fila.
- **Modo RBT = sólo lectura:** sin botón crear ni lápiz; le queda Ver PDF.
- ⚠️ El gate del front es UX, no seguridad: **B9 sigue pendiente en backend** (que el listado scope-ee por rol).

### FASE 6 — `template-documents/clinical-monthly` *(fuera de alcance, sugerido separar)*
Ese placeholder usa otro permiso (`CLINICAL_MONTHLY_CONFIGURATION`) y es configuración de plantilla, no la vista operativa. **Recomendación: HU aparte.**

---

## 7. Preguntas a responder antes de arrancar Fase 3

1. ~~**Provider**~~ ✅ resuelto: es el usuario logueado; se filtra por `client.clientProviders.providerId`.
2. ~~**Rango de fecha del filtro**~~ ✅ resuelto: período del reporte, con `Date_yyyy-MM-dd`.
3. ~~**Items al crear**~~ ✅ resuelto desde el Service Plan del cliente; no hace falta endpoint nuevo.
4. **Estatus** (B2) — *la única que falta para cerrar la HU*: ¿qué valores y quién los cambia? ¿Requiere firma como el Session Note?
5. **`DELETE`** (B6b): sin él, un reporte creado por error queda para siempre (más grave si se adopta el camino (a) de B10b).
6. **Paginación** (B8): ¿0-based como el resto del front, o 1-based como el ejemplo?
7. **`total`** (B3): ¿lo manda como `total`, `totalAmount`, o no lo manda?
8. **`providerName` en el listado**: el detalle ya lo resuelve; agregarlo al listado enciende la columna sola.
9. **Unicidad**: ¿el backend rechaza un CM duplicado para el mismo cliente+período, o se permiten varios?
10. **RBT** (B9): ¿el scope por rol lo aplica el backend, o el listado devuelve todo?
11. `passwordExpirationDate`: ¿entra en esta HU?

---

## 8. Referencias de código a reusar

| Necesidad | Archivo de referencia |
| --- | --- |
| Tabla + filtros | `app/(app)/session-note/hooks/useSessionNotesTable.tsx` |
| Servicio paginado | `lib/modules/clinical-documents/services/clinical-documents.service.ts` |
| Hook de listado | `lib/modules/clinical-documents/hooks/use-clinical-documents.ts` |
| Construcción de filtros | `lib/utils/query-filters.ts` + `lib/models/filterOperator.ts` |
| Proxy de PDF | `app/api/reports/appointment-note/preview/[fileName]/route.ts` |
| Permisos | `lib/hooks/use-permission.ts` + `lib/utils/permissions-new.ts` |
| Selects de cliente/provider | `use-clients-by-logged-user.ts` + `use-users.ts` |
