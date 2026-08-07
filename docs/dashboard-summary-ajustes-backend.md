# Dashboard Summary — Ajustes pendientes de backend

> Fecha: 2026-08-07
> Endpoint: `GET /dashboard/summary?scope=me|company`
> Contrato base: `docs/dashboard-summary-backend.md`
> Contrato en código: `lib/types/dashboard.types.ts` (fuente única de verdad)

## Estado — 2026-08-07 (mismo día)

Backend entregó §1 y §3. Queda abierto **§2 (`documentCompliance`)**.

| # | Tema | Estado |
| --- | --- | --- |
| 1 | `href` de cliente + `clientId` | ✅ Entregado y consumido por el front |
| 2 | Unidad de conteo de `documentCompliance` | 🟡 **Sin respuesta** |
| 3 | `notesPendingSignature` y las 97155 | ✅ Regla separada por CPT |

Lo entregado quedó reflejado en `docs/dashboard-summary-backend.md` §4.3, §4.4 y §4.5.
El detalle de abajo se conserva como registro de por qué se pidió cada cosa.

---

## 0. Resumen

El endpoint ya está conectado y el dashboard corre contra datos reales. Aparecieron
tres cosas al probarlo en producción: **una falla visible**, **una ambigüedad de
definición** y **una pregunta vieja que sigue sin respuesta**.

| # | Qué | Severidad | Quién lo arregla |
| --- | --- | --- | --- |
| 1 | `authorizationUtilization[].href` lleva a una página que no existe | **Rompe** — 404 al usuario | Backend |
| 2 | `documentCompliance` no define de qué es unidad cada conteo | Riesgo de número incorrecto | Backend (definir) |
| 3 | `notesPendingSignature` frente a las notas 97155 | Riesgo de número incorrecto | Backend (confirmar) |

El front ya aplicó mitigaciones para el punto 1 (§1.4), pero son un parche: el
arreglo de fondo es del lado del servidor.

---

## 1. `href` apunta a rutas que no existen en el front

### 1.1 Lo que pasa hoy

Las filas del widget *Authorization usage* llegan con:

```json
{ "href": "/clients/404fbab9-217d-45ee-8262-740cf8c8a7cd" }
```

Al hacer click, el usuario cae en **página no encontrada**.

### 1.2 Por qué

`/clients/<id>` **no es una página de esta aplicación**. El detalle de un cliente no
vive en la raíz del recurso, sino en subrutas. Estas son *todas* las rutas de cliente
que existen:

| Ruta | Qué es |
| --- | --- |
| `/clients` | Listado |
| `/clients/create` | Alta |
| `/clients/<id>/profile` | Wizard de perfil (**acá viven las Prior Authorizations**) |
| `/clients/<id>/configuration` | Service plan y configuración clínica |
| `/clients/<id>/edit` | Edición rápida |
| `/clients/<id>/service-plan/<spId>` | Un service plan concreto |

No hay `/clients/<id>` a secas. Cualquier `href` con esa forma es un 404 garantizado.

### 1.3 Duda abierta: ¿el UUID es del cliente o de la autorización?

El contrato dice que `authorizationUtilization[].id` es **el UUID de la autorización**
(§4.4 del doc base). Si el mismo UUID se está usando para armar la ruta del cliente,
el enlace queda mal aunque se corrija la ruta: apuntaría a un cliente inexistente.

**Cómo lo detectamos:** en un caso real, cuatro filas del widget correspondían al
**mismo cliente** con cuatro billing codes distintos. Si el `href` de las cuatro
lleva UUIDs **distintos**, se está mandando el id de la autorización.

**Pedido concreto:** agregar `clientId` como campo propio del item. Hoy sólo viene
`clientName`, así que el front no tiene forma de armar la ruta por su cuenta ni de
detectar el problema.

```json
{
  "id": "e5f6a7b8-...",          // id de la autorización (se mantiene)
  "clientId": "a1b2c3d4-...",    // ← NUEVO: id del cliente
  "clientName": "Cuquita La mora",
  "billingCode": "97153",
  "href": "/clients/a1b2c3d4-.../profile?step=priorAuth"
}
```

### 1.4 Reglas que el front aplica sobre `href`

Implementadas en `lib/modules/dashboard/utils/safe-href.ts`. Conviene conocerlas
porque cambian lo que se ve en pantalla:

1. **Sólo rutas internas.** Se descartan URLs absolutas (`https://…`), `javascript:`
   y protocol-relative (`//host`, `/\host`). Un `href` descartado **no rompe la fila**:
   queda sin enlace. Esto es defensa, no preferencia de estilo — el valor termina en
   el `href` de un `<a>`.

2. **Reparación de `/clients/<uuid>` a secas.** Se reescribe al paso del perfil donde
   se resuelve el pendiente:

   | Origen | Se reescribe a |
   | --- | --- |
   | `authorizationUtilization` | `/clients/<uuid>/profile?step=priorAuth` |
   | `expiring` · `PRIOR_AUTHORIZATION` | `/clients/<uuid>/profile?step=priorAuth` |
   | `expiring` · `CLIENT_DOCUMENT` | `/clients/<uuid>/profile?step=documents` |

   Es un parche para que el dashboard no quede inutilizable. **No lo tomen como el
   contrato**: si el UUID resulta ser el de la autorización (§1.3), la reparación no
   alcanza.

### 1.5 Deep-link al paso del wizard

El front agregó soporte para `?step=<id>` en `/clients/<id>/profile`. Sirve para
enlazar al lugar exacto donde se atiende algo en vez de dejar al usuario en la
primera pestaña buscando. Ids válidos:

`personalInfo` · `addresses` · `caregivers` · `medications` · `diagnoses` ·
`insurances` · `priorAuth` · `providers` · `documents`

Un `step` desconocido se ignora y abre el paso 1. **Pueden usarlo directamente en los
`href` que manden.**

### 1.6 Pedido

- [ ] Confirmar si el UUID del `href` es el del cliente o el de la autorización
- [ ] Agregar `clientId` a cada item de `authorizationUtilization`
- [ ] Mandar `href` a una ruta que exista, preferentemente con `?step=`
- [ ] Aplicar lo mismo a `expiring[].href` cuando el destino sea un cliente

---

## 2. `documentCompliance` — falta definir la unidad del conteo

### 2.1 Lo que llega hoy

```json
"documentCompliance": {
  "delivered": 0,
  "pending": 6,
  "nearExpiration": 0,
  "expired": 0
}
```

### 2.2 Por qué genera duda

En este sistema hay dos entidades distintas:

- **Configuración** (`documentConfig`) — el catálogo de la compañía: "Insurance Card",
  "Treatment Consent", etc.
- **Instancia** — el archivo que subió una persona concreta.

Y el punto clave: **una instancia sólo existe cuando alguien sube un archivo.**
`GET /client/documents/{clientId}` no devuelve documentos guardados, devuelve **el
catálogo expandido contra ese cliente**, con `id: null` en los que nunca se subieron.
Los HR documents tienen la misma forma.

O sea que un `PENDING` **no es un registro en la base**: es una ausencia calculada
—existe la configuración, existe la persona, no existe el archivo—.

Eso parte los cuatro contadores en dos grupos con naturaleza distinta:

| Contador | Se puede contar de registros reales |
| --- | --- |
| `delivered`, `nearExpiration`, `expired` | Sí — todos tienen archivo, la fila existe |
| `pending` | **No** — hay que derivarlo de `configuraciones × personas` menos lo subido |

`pending` es el único que exige un producto cruzado, y es justo donde es fácil contar
el catálogo en lugar de los pares.

### 2.3 La sospecha concreta

`pending: 6` con **0 en los otros tres** se lee muy parecido a *"hay 6 tipos de
documento configurados y nadie subió ninguno"* — que sería contar configuraciones, no
personas. Si hubiera 3 clientes y 6 configuraciones, el número correcto sería 18, no 6.

### 2.4 Pedido

- [ ] **Confirmar la unidad.** La esperada es el **par (persona × configuración)**,
      no la cantidad de configuraciones. Un cliente al que le faltan 6 documentos y
      tres clientes a los que les falta el mismo documento **no pueden dar lo mismo**.
- [ ] **Definir la ventana de `nearExpiration`.** El doc base §4.7 no la fija. El
      front usa **30 días** en la pantalla de documentos del cliente
      (`use-client-documents.ts:16`). Si backend usa otro umbral, el widget y la
      pestaña del cliente van a contar distinto sobre los mismos documentos y nada
      lo detecta.
- [ ] **Documentar qué entra en el alcance.** ¿Sólo clientes activos? ¿Empleados
      dados de baja? ¿Configuraciones desactivadas se siguen contando como pendientes?

---

## 3. `notesPendingSignature` y las notas 97155

Sigue abierta desde el contrato anterior (§7.3 del doc base). Se repite acá porque el
campo **cambió de forma** el 2026-08-07 —ahora es un número pelado, no un `KpiValue`—
y conviene cerrarla junto con el resto.

La regla entregada es: pendiente cuando no hay `caregiverSignatureImage` y
`caregiverSignatureChecked` no es `true`. Pero **las notas 97155 (supervisión) no
tienen caregiver**: llevan firma de provider y de supervisee. Según cómo esté hecha la
consulta, o quedan contadas como pendientes para siempre, o quedan fuera del KPI.

### Pedido

- [ ] Confirmar qué pasa con las 97155
- [ ] Confirmar si la firma del provider debería contar para el KPI

---

## 4. Estado actual del contrato (referencia)

Cambios ya aplicados en el front, para que no haya sorpresas:

| Campo | Estado |
| --- | --- |
| `kpis.notesPendingSignature` | **`number` pelado**. `0` es válido y se pinta como cero, no como "sin datos" |
| `trend.points[].notesPending` | **Eliminado**. La tendencia es serie única de sesiones |
| `expiring[].href` | Validado como ruta interna; se repara si viene `/clients/<uuid>` |
| `authorizationUtilization[].href` | Idem — **y ahora sí se usa**, antes el front lo ignoraba |

---

## 5. Checklist para backend

**Bloqueante (hay usuarios cayendo en 404):**

- [x] `authorizationUtilization[].href` → ruta existente
- [x] Agregar `clientId` al item de `authorizationUtilization`
- [x] Confirmar si el UUID del href es del cliente o de la autorización
      → era el de `authorization_billing_code`; ahora `clientId` viaja aparte

**Definiciones (el número puede estar mal y no lo sabemos):**

- [ ] **Unidad de conteo de `documentCompliance` = par (persona × configuración)**
- [ ] **Ventana de días de `nearExpiration`**
- [ ] **Alcance de `documentCompliance`: activos/inactivos, configuraciones desactivadas**
- [x] Tratamiento de las 97155 en `notesPendingSignature`
      → regla separada por CPT: `97155` mira `MemberUser.sign` del supervisee
