# Dashboard — Requerimiento Backend

> Fecha: 2026-08-04
> Front: **implementado y funcionando con mock**. Ver `plans/dashboard.md`.
> Contrato en código: `lib/types/dashboard.types.ts` (fuente única de verdad).

## 0. Resumen ejecutivo

El dashboard está construido y andando contra datos mock. **Falta un solo endpoint**
para conectarlo:

```http
GET /dashboard/summary?scope=me|company
```

Conectarlo del lado del front es cambiar una variable de entorno
(`NEXT_PUBLIC_DASHBOARD_MOCK=false`). No hay que tocar ni un componente.

El mock está tipado contra el mismo contrato que el servicio real, así que **la
forma del JSON de abajo es exactamente la que el front ya sabe consumir**.

---

## 1. Por qué un endpoint agregado y no pegarle a cada módulo

1. Armarlo desde el cliente son **6+ requests paginados sólo para contar**.
2. El `total` de paginación **no es confiable de forma pareja**: en Clinical Monthly
   comprobamos que unos listados mandan `total`, otros `totalAmount` y otros nada.
3. El **scope por rol** se resuelve en un solo lugar del servidor en vez de
   duplicar la lógica en el cliente (donde además sería sólo cosmético, no seguridad).

---

## 2. El endpoint

### `GET /dashboard/summary`

| Query param | Valores | Default | Significado |
| --- | --- | --- | --- |
| `scope` | `me` \| `company` | `company` | `me` = sólo lo del usuario logueado. `company` = toda la compañía, **limitado por lo que el rol puede ver**. |

**Response `200`** — el objeto completo. Todos los ejemplos siguientes son secciones
de este mismo objeto.

### 🔑 Regla de oro: entrega parcial permitida

**Todas las secciones son opcionales.** El front está construido para que cada widget
degrade solo: si `trend` no viene, ese widget muestra "pendiente de backend" y **el
resto del dashboard sigue funcionando**.

Esto significa que **pueden entregar por partes**. No hace falta esperar a tenerlo
todo — arranquen por `actionCenter` + `expiring`, que es el corazón del dashboard.

---

## 3. Contrato completo

```json
{
  "generatedAt": "2026-08-04T14:32:00.000Z",

  "actionCenter": {
    "total": 10,
    "criticalCount": 3,
    "byKind": {
      "PRIOR_AUTHORIZATION": 3,
      "CREDENTIAL": 3,
      "CLIENT_DOCUMENT": 2,
      "HR_DOCUMENT": 2
    }
  },

  "kpis": {
    "sessionsThisWeek": {
      "value": 128,
      "deltaPercent": 12.4,
      "deltaDirection": "up",
      "higherIsBetter": true,
      "sparkline": [96, 104, 99, 112, 108, 118, 115, 124, 119, 131, 127, 128]
    },
    "notesPendingSignature": {
      "value": 7,
      "deltaPercent": 30,
      "deltaDirection": "down",
      "higherIsBetter": false,
      "sparkline": [11, 9, 14, 8, 12, 6, 10, 7, 9, 5, 8, 7]
    },
    "authorizationUsage": {
      "value": 72,
      "unit": "%",
      "target": 100,
      "deltaPercent": 4.1,
      "deltaDirection": "up",
      "higherIsBetter": false
    },
    "clinicalMonthlyThisMonth": {
      "value": 8,
      "target": 12,
      "deltaDirection": "flat",
      "higherIsBetter": true
    }
  },

  "expiring": {
    "total": 10,
    "items": [
      {
        "id": "a1b2c3d4-...",
        "kind": "PRIOR_AUTHORIZATION",
        "title": "Prior Auth #A-1024 · 97153",
        "subject": "Mateo Rivas",
        "expirationDate": "2026-08-02",
        "daysRemaining": -2,
        "severity": "critical",
        "href": "/clients/a1b2c3d4-.../configuration"
      }
    ]
  },

  "authorizationUtilization": {
    "items": [
      {
        "id": "e5f6a7b8-...",
        "clientName": "Mateo Rivas",
        "billingCode": "97153",
        "unitsAuthorized": 480,
        "unitsUsed": 449,
        "percentUsed": 94,
        "endDate": "2026-08-25",
        "severity": "critical",
        "href": "/clients/e5f6a7b8-..."
      }
    ]
  },

  "trend": {
    "points": [
      { "label": "W1", "sessions": 96, "notesPending": 11 },
      { "label": "W2", "sessions": 104, "notesPending": 9 }
    ]
  },

  "documentCompliance": {
    "delivered": 120,
    "pending": 34,
    "nearExpiration": 12,
    "expired": 3
  }
}
```

---

## 4. Sección por sección

### 4.1 `generatedAt` — **obligatorio**

ISO 8601 con zona. Es lo único que no es opcional.

### 4.2 `actionCenter` — el número grande de la cabecera

| Campo | Tipo | Notas |
| --- | --- | --- |
| `total` | `number` | Total de asuntos que requieren atención (= cantidad de `expiring.items` en el horizonte) |
| `criticalCount` | `number` | Cuántos de esos son `severity: "critical"` |
| `byKind` | `object` | Conteo por tipo. Claves parciales: si un tipo es 0, puede omitirse |

Claves válidas de `byKind`: `PRIOR_AUTHORIZATION`, `CREDENTIAL`, `CLIENT_DOCUMENT`, `HR_DOCUMENT`.

### 4.3 `expiring` — la lista unificada de vencimientos *(la más importante)*

Las cuatro fuentes se **unifican en una sola lista** porque comparten la misma
pregunta: *¿cuántos días me quedan?*

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | UUID del registro original |
| `kind` | enum | `PRIOR_AUTHORIZATION` \| `CREDENTIAL` \| `CLIENT_DOCUMENT` \| `HR_DOCUMENT` |
| `title` | `string` | Qué vence. Ej: `"Prior Auth #A-1024 · 97153"`, `"BCBA Certification"` |
| `subject` | `string` | A quién le vence: nombre del cliente o del miembro del staff |
| `expirationDate` | `string` | ISO date `yyyy-MM-dd` |
| `daysRemaining` | `number` | **Lo calcula backend.** Negativo = ya vencido |
| `severity` | enum | `critical` \| `serious` \| `warning` \| `good` — ver §5 |
| `href` | `string?` | Ruta del front a donde ir para resolverlo. Opcional |

- **`items`**: devolver el **top 20** ordenado por urgencia (§5.3). El front muestra 6
  colapsados y expande al resto.
- **`total`**: el total real **sin truncar** — la UI muestra "ver los N".

#### ⚠️ `daysRemaining` lo calcula el backend, a propósito

No es un capricho. Si el front resta fechas contra el reloj del equipo del usuario,
reproduce **exactamente el bug de desfase de reloj** que ya nos costó una corrección
en `auth.store.ts` (un usuario con el reloj adelantado veía vencimientos que no
existían). La fecha de corte la define el servidor.

#### De dónde sale cada `kind`

| `kind` | Fuente en el modelo actual | Estado |
| --- | --- | --- |
| `CLIENT_DOCUMENT` | Documentos de cliente — `expirationDate` + `status` | ✅ Backend **ya computa** `NEAR_EXPIRATION` |
| `HR_DOCUMENT` | Documentos HR del staff — mismo enum | ✅ Ya computado |
| `PRIOR_AUTHORIZATION` | Prior Authorizations — `endDate` | ✅ Dato crudo disponible |
| `CREDENTIAL` | Credenciales de usuario — `expirationDate` + `status` | ⚠️ **Ver §7.1** |

### 4.4 `authorizationUtilization` — riesgo de sobre-utilización

Es el caso de uso que CentralReach llama *"mitigar el riesgo de autorizaciones
sobre-utilizadas"*: unidades consumidas contra autorizadas, por cliente y billing code.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `string` | UUID de la autorización (o del par auth+billing code) |
| `clientName` | `string` | |
| `billingCode` | `string` | Ej: `"97153"` |
| `unitsAuthorized` | `number` | |
| `unitsUsed` | `number` | |
| `percentUsed` | `number` | 0..100, **ya redondeado** |
| `endDate` | `string` | ISO date |
| `severity` | enum | Según §5.2 |
| `href` | `string?` | |

Devolver el **top 5** por `percentUsed` descendente. Sólo autorizaciones **activas**.

### 4.5 `kpis` — los 4 números de cabecera

Los cuatro son opcionales por separado.

| KPI | Qué mide |
| --- | --- |
| `sessionsThisWeek` | Appointments de la semana en curso |
| `notesPendingSignature` | Session notes sin firmar / sin cerrar |
| `authorizationUsage` | % global de unidades consumidas (`unit: "%"`, `target: 100`) |
| `clinicalMonthlyThisMonth` | Clinical Monthly creados este mes contra los esperados (`target`) |

Estructura de cada uno (`KpiValue`):

| Campo | Tipo | Notas |
| --- | --- | --- |
| `value` | `number` | **Único obligatorio** |
| `deltaPercent` | `number?` | Variación contra el período anterior, **en positivo siempre** — el signo lo da `deltaDirection` |
| `deltaDirection` | `"up" \| "down" \| "flat"` | |
| `higherIsBetter` | `boolean?` | **Importante, ver abajo** |
| `sparkline` | `number[]?` | **12 puntos**, del más viejo al más nuevo |
| `target` | `number?` | Para KPIs que son un ratio contra un tope |
| `unit` | `string?` | Sufijo de presentación, ej. `"%"` |

#### ⚠️ `higherIsBetter` no es opcional en la práctica

Decide el **color** del delta. Sin este campo el verde y el rojo mienten: que suban
las *sesiones* es bueno (`true`), que suban las *notas pendientes* es malo (`false`).
Mándenlo siempre.

### 4.6 `trend` — serie temporal

12 puntos, uno por semana, del más viejo al más nuevo.

| Campo | Tipo |
| --- | --- |
| `label` | `string` — ej. `"W1"` o `"Jul 28"` |
| `sessions` | `number` |
| `notesPending` | `number` |

> El front las dibuja como **small multiples** (dos gráficas separadas), no con doble
> eje. No hace falta que vengan normalizadas.

### 4.7 `documentCompliance` — cumplimiento documental

Los cuatro son conteos absolutos; el front calcula los porcentajes.

| Campo | Significado |
| --- | --- |
| `delivered` | Entregados y vigentes |
| `pending` | Pendientes de entrega |
| `nearExpiration` | Por vencer |
| `expired` | Vencidos |

Alcance: documentos de cliente + documentos HR, según lo que el rol pueda ver.

---

## 5. Reglas de negocio — cómo calcular `severity`

`severity` la calcula el **backend** y viaja en la respuesta. El front tiene los
mismos umbrales en `lib/modules/dashboard/utils/severity.ts` para el mock, pero en
producción **usa el valor que manda el servidor**.

### 5.1 Vencimientos (`expiring[].severity`)

| Severidad | Días restantes |
| --- | --- |
| `critical` | ≤ 7 (incluye negativos: ya vencido) |
| `serious` | 8 – 30 |
| `warning` | 31 – 60 |
| `good` | > 60 |

**Horizonte:** el endpoint devuelve sólo lo que vence en los **próximos 60 días**
más lo ya vencido. Nada con `severity: "good"` entra en la lista.

### 5.2 Utilización de autorizaciones (`authorizationUtilization[].severity`)

| Severidad | % de unidades consumidas |
| --- | --- |
| `critical` | ≥ 90% |
| `serious` | 75 – 89% |
| `warning` | 60 – 74% |
| `good` | < 60% |

### 5.3 Orden de `expiring.items`

```
severity ↓  →  daysRemaining ↑  →  kind (desempate alfabético)
```

El desempate por `kind` **no es cosmético**: sin un orden estable la lista "baila"
entre refrescos y el usuario pierde el hilo de lo que estaba mirando.

> Los umbrales de §5.1 y §5.2 son **una propuesta inicial**. La práctica clínica dice
> calibrarlos contra el histórico propio. Si tienen números del negocio, mejor —
> cambiarlos del lado del front es una línea. A futuro pueden volverse configuración
> de compañía.

---

## 6. 🔴 Scope por rol — esto es seguridad, no UX

El front compone la vista según permisos (`useDashboardLayout`), **pero eso es sólo
presentación**. El filtrado real tiene que aplicarlo el backend en el endpoint.

| Rol | Qué debe ver |
| --- | --- |
| **Analista / BCBA / Admin** | Todo lo de sus clientes asignados (o de la compañía, según §7.2) |
| **RBT** | **Sólo sus propias credenciales y documentos HR**, y sus propias sesiones. **Nunca** utilización de autorizaciones ni cumplimiento documental de clientes |

Si el backend no scope-ea, **un RBT recibiría PHI de clientes que no le
corresponden** aunque la UI no se lo pinte — basta con mirar la respuesta en el
navegador. Es el mismo punto que quedó abierto en SCRUM-163 (gap B9).

Concretamente, para `scope=company` con un RBT:
- `expiring.items` → sólo `kind: CREDENTIAL` y `HR_DOCUMENT` **del propio usuario**
- `authorizationUtilization` → omitir la sección
- `documentCompliance` → omitir la sección
- `kpis` → sólo `sessionsThisWeek` y `notesPendingSignature`, de sus propias sesiones

---

## 7. Preguntas a resolver

### 7.1 Credenciales: ¿existe "por vencer"?

Hoy el estado de credencial es binario (`Active` / `Expired`), sin `NEAR_EXPIRATION`
— a diferencia de los documentos de cliente y HR, donde el backend **ya lo computa**.

**Preferencia:** que backend exponga el estado intermedio, consistente con el resto
del sistema. Como el endpoint del dashboard ya devuelve `daysRemaining` y `severity`
calculados, para esta HU alcanza con que el cálculo se haga ahí; pero conviene
alinearlo también en el módulo de credenciales.

### 7.2 `scope=company` para un analista: ¿toda la compañía o sólo sus clientes asignados?

El front manda `company` por defecto. Necesitamos saber qué significa exactamente
para un analista, porque cambia los números de todos los widgets.

### 7.3 ¿`clinicalMonthlyThisMonth.target` de dónde sale?

Es "cuántos Clinical Monthly se esperan este mes". Puede ser la cantidad de clientes
activos con Service Plan, o un número configurado. Si no hay una definición, se puede
omitir `target` y el KPI se muestra como número suelto.

### 7.4 ¿Cuántos puntos de `trend` y con qué agrupación?

Asumimos **12 semanas**. Si prefieren meses, sólo cambia el `label` — el front no
asume nada más que el orden.

### 7.5 Vencimiento de contraseña

El login ya devuelve `passwordExpirationDate` y **el front hoy lo ignora**. No lo
metimos en el dashboard porque es del usuario, no de la operación — nos inclinamos
por un banner global. ¿Están de acuerdo?

---

## 8. Criterios de aceptación

1. `GET /dashboard/summary?scope=company` responde `200` con al menos `generatedAt`.
2. Todas las secciones son omitibles y el front no rompe con ninguna combinación.
3. `daysRemaining` viene calculado por el servidor; el front no hace aritmética de fechas.
4. `severity` viene calculada y respeta los umbrales de §5.
5. `expiring.items` viene ordenado por §5.3 y truncado a 20, con `total` sin truncar.
6. `higherIsBetter` viene en **todos** los KPIs que lo tengan definido.
7. Un RBT autenticado **no recibe** `authorizationUtilization` ni `documentCompliance`,
   ni items de `expiring` de otros usuarios o de clientes.
8. `sparkline` trae 12 puntos cuando viene.

---

## 9. Referencias de código

| Qué | Dónde |
| --- | --- |
| Contrato TypeScript (fuente de verdad) | `lib/types/dashboard.types.ts` |
| Umbrales y orden | `lib/modules/dashboard/utils/severity.ts` |
| Ejemplo completo de respuesta | `lib/modules/dashboard/mocks/dashboard.mock.ts` |
| Servicio HTTP ya escrito | `lib/modules/dashboard/services/dashboard.service.ts` |
| Interruptor mock ↔ real | `lib/modules/dashboard/services/dashboard.source.ts` |
| Composición por rol (UX) | `app/(app)/dashboard/hooks/useDashboardLayout.ts` |
| Análisis y decisiones de diseño | `plans/dashboard.md` |
