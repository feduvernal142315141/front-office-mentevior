# Dashboard — Análisis, Diseño y Plan de Implementación

> **Fecha:** 2026-08-03 | **Estado:** IMPLEMENTADO (mock)
> **Alcance de esta etapa:** UI completa con **datos mock**, con toda la instalación eléctrica lista para que, cuando backend entregue, se conecte cambiando **una sola constante**.
>
> **Avance:** Fases 1–6 ✅ · build y typecheck en verde · paleta re-validada con los colores finales.
> **Supuestos tomados** (§10 sin responder al momento de construir): umbrales de §6.1 tal cual, y `scope=company` por defecto.

---

## 1. Punto de partida

`app/(app)/dashboard/page.tsx` es un placeholder "Coming Soon" de 40 líneas con un `console.log` del usuario. No existe módulo, ni tipos, ni servicio. Todo lo de abajo es construcción nueva.

---

## 2. Investigación — qué hace el resto del mercado

### 2.1 Los dos referentes directos del rubro ABA

| Producto | Qué resuelve en su dashboard |
| --- | --- |
| **CentralReach** | Rastrea **unidades restantes por billing code** de cada autorización y **avisa cuando la autorización está por vencer**. Tiene un caso de uso con nombre propio: *mitigar el riesgo de autorizaciones sobre-utilizadas*. En implementaciones grandes cruza credenciales + autorizaciones + reglas laborales para asignar staff a sesiones. |
| **Motivity** | **Alertas personales de vencimiento y aprobación de credenciales**. Dashboards segmentables por learner, ubicación, equipo y pagador. |

**Lectura:** los dos convergen en lo mismo — **autorizaciones y credenciales son el corazón del dashboard**, no las gráficas bonitas. Ambos son problemas de *fecha límite*, y ambos cuestan plata directa cuando se pasan. Coincide con el inventario de nuestro modelo de datos (§3).

### 2.2 Buenas prácticas de dashboards clínicos

Cuatro hallazgos que cambian decisiones de diseño concretas:

1. **Segmentar por rol.** Mezclar indicadores clínicos, operativos y financieros en una sola vista genera sobrecarga cognitiva y erosiona la confianza en la plataforma. → **decisión: la vista se compone por rol** (§5).
2. **Los umbrales mal calibrados son la principal causa de abandono de dashboards** en entornos clínicos. Deben calibrarse contra los datos históricos propios, no contra un número inventado. → **decisión: los umbrales viven en UN archivo, versionado y discutible** (§6.3), no dispersos en componentes.
3. **Usar forma o patrón como señal secundaria además del color**, y cumplir contraste WCAG 2.1. → coincide con el método de visualización que seguimos (§7).
4. **Reservar el rojo exclusivamente para alertas críticas.** → **decisión: los tokens de estado son reservados** y no se reciclan como color de serie (§7.2).

**Fuentes:** [CentralReach — autorizaciones sobre-utilizadas](https://centralreach.com/blog/mitigating-risks-associated-with-over-utilized-authorizations-in-aba-practices/) · [CR Essentials](https://essentials.centralreach.com/) · [Motivity — practice management](https://www.motivity.net/solutions/aba-practice-management-all-in-one) · [Healthcare dashboard design best practices](https://fuselabcreative.com/healthcare-dashboard-design-best-practices/) · [Credentialing KPIs — Verisys](https://verisys.com/blog/credentialing-kpis-healthcare-executives/) · [Clinical oversight dashboard ABA](https://www.praxisnotes.com/resources/clinical-oversight-dashboard-aba-guide)

---

## 3. Inventario — qué señales YA existen en nuestro modelo

Esto es lo que hace el plan realista: casi todo el dato ya existe.

| Señal | Dónde vive | Estado |
| --- | --- | --- |
| Documentos de cliente | `client-document.types.ts` — `expirationDate` + `status: PENDING \| DELIVERED \| NEAR_EXPIRATION` | ✅ **El backend ya computa `NEAR_EXPIRATION`** |
| Documentos HR del staff | `user-hr-document.types.ts` — mismo enum | ✅ Ya computado |
| Credenciales | `user-credentials.types.ts` — `expirationDate` + `status: Active \| Expired` | ⚠️ **Binario**: no existe "por vencer". Se calcula en el front o se pide a backend |
| Prior Authorizations | `prior-authorization.types.ts` — `startDate`/`endDate` + `authorizationBillingCodes[]` con unidades | ✅ Dato crudo disponible, sin estado derivado |
| Notas de sesión | `appointment-note.types.ts` — `noteStatus: read \| active \| close \| lock` | ✅ Disponible |
| Clinical Monthly | HU SCRUM-163 — listado por cliente y período | ✅ Recién construido |
| Vencimiento de contraseña | `passwordExpirationDate` en la respuesta del login | ⚠️ **El front lo tira a la basura hoy** |
| Perfil incompleto | `requiredOptions` en el JWT (`credentialsSignature`, `professionalInformation`) | ✅ Ya se decodifica en `auth.store.ts` |

---

## 4. Arquitectura de información

### 4.1 El principio rector

Un dashboard clínico no es un reporte: es una **cola de trabajo priorizada**. La pregunta que debe responder en menos de tres segundos es *"¿qué tengo que hacer hoy y qué se me está por vencer?"* — no *"cuántas sesiones hubo en Q2"*.

De ahí sale la jerarquía: **acción primero, tendencia después**.

### 4.2 Los widgets

| # | Widget | Job (§7.1) | Forma |
| --- | --- | --- | --- |
| **W1** | **Centro de atención** — el número que encabeza | headline único | **Hero figure** (≥48px) + chips de desglose |
| **W2** | **Fila de KPIs** | 4 números de cabecera | **KPI row** de stat tiles (valor + delta + sparkline) |
| **W3** | **Vencimientos** — lista unificada ordenada por días restantes | identidad + severidad | **Tabla** con badge de estado |
| **W4** | **Utilización de autorizaciones** | ratio contra un límite | **Meters** (track del mismo ramp) |
| **W5** | **Tendencia de sesiones y notas** | cambio en el tiempo | **Línea** con énfasis (una serie protagonista, resto en gris) |
| **W6** | **Cumplimiento documental** | parte-de-un-todo | **Barra apilada horizontal** |

**Por qué W3 es una tabla y no seis widgets separados:** las cuatro fuentes de vencimiento (auths, credenciales, docs de cliente, docs HR) comparten la misma pregunta — *¿cuántos días me quedan?* — y más de ~7 clases que todas cargan significado piden tabla, no más colores. Una sola lista ordenada por urgencia vence a cuatro tarjetas que obligan a comparar mentalmente.

**Por qué no hay dona ni pie:** parte-de-un-todo se resuelve con barra apilada. Una dona de dos porciones es un meter mal dibujado.

**Por qué exactamente un hero:** el método admite uno por vista. Dos números gigantes compiten y ninguno gana.

### 4.3 Composición por rol

Cumpliendo el hallazgo §2.2.1. Se resuelve con `usePermission()` y `PermissionModule`, que ya existen:

| Rol | W1 | W2 | W3 | W4 | W5 | W6 |
| --- | --- | --- | --- | --- | --- | --- |
| **Analista / BCBA** | ✅ | ✅ | ✅ todas las fuentes | ✅ | ✅ | ✅ |
| **RBT** | ✅ *(sólo lo suyo)* | ✅ reducido | ✅ sus credenciales y docs HR | ❌ | ✅ sus sesiones | ❌ |
| **Admin / Billing** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

El RBT nunca ve utilización de autorizaciones ni cumplimiento documental de clientes: no es su trabajo y es PHI que no le corresponde.

> ⚠️ El filtrado en el front es **UX, no seguridad**. El scope real por rol lo tiene que aplicar el backend (mismo punto que quedó abierto en SCRUM-163).

---

## 5. Arquitectura técnica — "los cables listos"

Este es el corazón del pedido: **mock hoy, backend mañana, sin reescribir nada**.

### 5.1 La costura

Un único punto de intercambio. Los componentes **jamás** saben de dónde viene el dato.

```
components  →  useDashboardSummary()  →  dashboard.source.ts  ─┬─→ dashboard.service.ts   (HTTP real)
                                                               └─→ dashboard.mock.ts      (mock)
```

```
lib/types/dashboard.types.ts                    ← el contrato, única fuente de verdad
lib/modules/dashboard/
  services/dashboard.service.ts                 ← GET /dashboard/summary
  mocks/dashboard.mock.ts                       ← datos mock tipados con el MISMO tipo
  services/dashboard.source.ts                  ← el interruptor
  hooks/use-dashboard-summary.ts                ← firma idéntica en ambos modos
  utils/severity.ts                             ← umbrales + cálculo de severidad
app/(app)/dashboard/
  page.tsx
  components/                                   ← widgets W1..W6 + primitivas
```

**El interruptor:**

```ts
// dashboard.source.ts
const USE_MOCK = process.env.NEXT_PUBLIC_DASHBOARD_MOCK !== "false"

export const fetchDashboardSummary = USE_MOCK
  ? fetchDashboardSummaryMock
  : fetchDashboardSummaryReal
```

Conectar backend = poner una variable de entorno. Nada más.

### 5.2 Las tres reglas que hacen que esto funcione de verdad

1. **El mock respeta el contrato al pie de la letra.** Está tipado con `DashboardSummary`, no con `any`. Si backend cambia el contrato, TypeScript rompe el mock y nos enteramos al compilar, no en producción.
2. **El mock simula la realidad, no el caso feliz.** Latencia artificial (~600ms), y modos forzables por query param para desarrollar los estados sin esperar a que fallen solos:
   - `?mock=empty` → sin pendientes (estado vacío celebratorio)
   - `?mock=error` → error de red
   - `?mock=partial` → backend entregó unas secciones y otras no
   - `?mock=heavy` → volumen alto, para ver overflow y paginación
3. **Degradación por sección, no todo-o-nada.** Cada sección del contrato es opcional. Backend va a entregar por partes (igual que pasó en Clinical Monthly): si `credentials` viene `undefined`, ese widget muestra su propio estado "pendiente" y **el resto del dashboard funciona**. Es el mismo patrón adaptativo que ya probamos con la columna Provider.

### 5.3 El contrato

```ts
export type Severity = "critical" | "serious" | "warning" | "good"

export interface ExpiringItem {
  id: string
  kind: "PRIOR_AUTHORIZATION" | "CREDENTIAL" | "CLIENT_DOCUMENT" | "HR_DOCUMENT"
  title: string          // "Aggression — Prior Auth #A-1024"
  subject: string        // cliente o miembro del staff
  expirationDate: string // ISO
  daysRemaining: number  // lo calcula backend; el front NO hace date-math sobre husos ajenos
  severity: Severity
  href?: string          // a dónde ir para resolverlo
}

export interface AuthorizationUtilization {
  id: string
  clientName: string
  billingCode: string
  unitsAuthorized: number
  unitsUsed: number
  percentUsed: number    // 0..100
  endDate: string
  severity: Severity
}

export interface TrendPoint { label: string; sessions: number }

export interface DashboardSummary {
  generatedAt: string
  actionCenter?: { total: number; byKind: Record<string, number> }
  kpis?: {
    sessionsThisWeek?: KpiValue
    notesPendingSignature?: number   // cantidad acumulada, no KpiValue
    authorizationUsage?: KpiValue
    clinicalMonthlyThisMonth?: KpiValue
  }
  expiring?: { items: ExpiringItem[]; total: number }
  authorizationUtilization?: { items: AuthorizationUtilization[] }
  trend?: { points: TrendPoint[] }
  documentCompliance?: { pending: number; delivered: number; nearExpiration: number; expired: number }
}

export interface KpiValue {
  value: number
  deltaPercent?: number      // vs período anterior
  deltaDirection?: "up" | "down" | "flat"
  higherIsBetter?: boolean   // decide el COLOR del delta; sin esto, verde/rojo mienten
  sparkline?: number[]       // 12 puntos
}
```

**Nota sobre `daysRemaining`:** lo calcula el backend a propósito. Que el front reste fechas contra el reloj del equipo es exactamente el bug de desfase de reloj que acabamos de arreglar en `auth.store.ts`. La fecha de corte la define el servidor.

### 5.4 Endpoint propuesto a backend

```http
GET /dashboard/summary?scope=me|company
```

Devuelve el `DashboardSummary` completo, **ya scope-eado por rol**, con conteos + top N por bucket (N=5 en tarjetas, N=20 en la lista).

**Por qué un solo endpoint y no seis:** armarlo pegándole a cada módulo son 6+ requests paginados sólo para contar, y el `total` de paginación no es confiable en todos los listados (lo comprobamos en Clinical Monthly: unos mandan `total`, otros `totalAmount`, otros nada). Un agregado además resuelve el scope por rol en un solo lugar en vez de duplicar la lógica en el cliente.

---

## 6. Reglas de negocio

### 6.1 Umbrales de severidad *(un solo archivo: `utils/severity.ts`)*

Contra el hallazgo §2.2.2 — mal calibrados, matan el dashboard.

| Severidad | Días restantes | Uso |
| --- | --- | --- |
| `critical` | ≤ 7 o ya vencido | rojo, arriba de todo |
| `serious` | 8–30 | naranja |
| `warning` | 31–60 | amarillo |
| `good` | > 60 | no aparece en la lista |

**Utilización de autorizaciones** (el riesgo que CentralReach llama sobre-utilización):

| Severidad | % de unidades consumidas |
| --- | --- |
| `critical` | ≥ 90% |
| `serious` | 75–89% |
| `warning` | 60–74% |
| `good` | < 60% |

> Estos números son **una propuesta inicial, no un dogma**. La práctica dice calibrarlos contra nuestro histórico. Por eso viven en un archivo aparte con constantes nombradas: cambiarlos es una línea, y más adelante pueden volverse configuración de compañía.

### 6.2 Ordenamiento de la lista de vencimientos

`severity` desc → `daysRemaining` asc → `kind` (para desempate estable). Sin desempate estable, la lista "baila" entre refrescos y el usuario pierde el hilo.

### 6.3 Credenciales — el hueco conocido

`UserCredentialStatus` es `Active | Expired`, sin "por vencer". Dos caminos:
- **(a)** Pedir a backend que exponga `NEAR_EXPIRATION` como ya lo hace en documentos → **preferida**, consistente con el resto del sistema.
- **(b)** Derivarlo en el front desde `expirationDate`.

Mientras se decide, el mock ya modela credenciales con severidad, así que la UI queda terminada.

---

## 7. Diseño visual

### 7.1 Procedimiento

Se sigue el método de visualización de datos: **forma primero, color al final**, y la paleta se **valida con script**, no a ojo.

### 7.2 Paleta — anclada a nuestra marca y validada

Nuestro azul de marca `#037ECC` (el mismo de los gradientes y de `FrequencyChart.tsx:302`) ocupa el **slot 1** categórico. El resto son los hues de referencia.

```
#037ECC · #eb6834 · #1baf7a · #eda100 · #e87ba4 · #008300 · #4a3aa7 · #e34948
```

**Resultado del validador (modo claro, superficie `#fcfcfb`):**

| Check | Resultado |
| --- | --- |
| Banda de luminosidad | ✅ los 8 dentro de L 0.43–0.77 |
| Piso de croma | ✅ los 8 ≥ 0.1 |
| Separación CVD | ✅ peor par adyacente ΔE **9.1** (objetivo ≥ 8) |
| Piso de visión normal | ✅ peor par adyacente ΔE **19.6** (piso ≥ 15) |
| Contraste vs superficie | ⚠️ 3 slots por debajo de 3:1 → **regla de alivio** |

**La advertencia de contraste no es descartable**: `#1baf7a`, `#eda100` y `#e87ba4` obligan a etiqueta directa visible o vista de tabla donde se usen. En la práctica casi no nos pega, porque el dashboard usa **una sola serie con énfasis** en la mayoría de las gráficas.

**Tokens de estado — reservados, nunca como "serie 4":**

| Estado | Hex | Uso |
| --- | --- | --- |
| good | `#0ca30c` | al día |
| warning | `#fab219` | 31–60 días |
| serious | `#ec835a` | 8–30 días |
| critical | `#d03b3b` | ≤ 7 días o vencido |

Siempre **con icono + etiqueta**, jamás color solo (§2.2.3 y la regla del rojo reservado de §2.2.4).

### 7.3 Especificaciones de marca gráfica

- Líneas de **2px**; marcadores ≥ **8px**; extremos de barra redondeados **4px** anclados a la línea base.
- **2px de separación de superficie** entre rellenos contiguos (segmentos apilados y barras vecinas).
- Grilla y ejes **recesivos** — ya tenemos el tono: `hsl(240 20% 93%)`, el mismo `--border` que usan los datasheets.
- **Etiquetas directas selectivas**, nunca un número sobre cada punto.
- **Capa de hover por defecto**: crosshair + tooltip en líneas, tooltip por marca en barras. Ya hay precedente en `FrequencyChart.tsx:438`.
- Valores de stat tile con **figuras proporcionales**; `tabular-nums` **sólo** en columnas de tabla.
- **Prohibido el doble eje.** Sesiones y notas pendientes son escalas distintas → dos gráficas o indexado a base común, nunca dos escalas Y.

### 7.4 Nuestro lenguaje visual — ya está definido, hay que respetarlo

El proyecto tiene un dialecto consistente que sale de `SessionNoteForm.tsx` y ya replicamos en Clinical Monthly. El dashboard **no inventa uno nuevo**:

| Elemento | Especificación existente |
| --- | --- |
| Tarjeta de sección | `rounded-2xl border border-slate-200 bg-white shadow-sm` |
| Header de sección | `px-5 py-3 border-b border-slate-100` + icono en `h-8 w-8 rounded-lg bg-[#037ECC]/10` |
| Sub-tarjeta | `rounded-xl border-slate-200 bg-slate-50/50` con header blanco |
| Badge de conteo | `rounded-full bg-[#037ECC]/10 text-[#037ECC] text-[10px] font-bold` |
| Fila destacada | `bg-[#037ECC]/[0.03] border-l-2 border-l-[#037ECC]` |
| Título de página | `text-3xl font-bold bg-gradient-to-r from-[#037ECC] to-[#079CFB] bg-clip-text text-transparent` |
| Tile de icono | `p-3 rounded-xl bg-gradient-to-br from-[#037ECC]/10 to-[#079CFB]/10 border border-[#037ECC]/20` |

Componentes a reusar tal cual: `Card`, `CustomTable`, `Button`, `FloatingSelect`, `PremiumDatePicker`, `InfoTooltip`, `Tabs`.

**Modo oscuro:** la app hoy es sólo claro (`globals.css` no define `.dark` ni `prefers-color-scheme`). No se implementa, pero **los colores de gráfica se declaran como CSS custom properties** para que agregarlo después sea cambiar tokens en un lugar y re-validar, no reescribir gráficas.

### 7.5 Boceto de layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [icono]  Dashboard                          Buenos días, Frank  │
├──────────────────────────────────────────────────────────────────┤
│  W1   ┌────────────────────────────────────────────────────┐     │
│       │   12   asuntos requieren tu atención               │     │
│       │  ▲48px  [3 críticos] [5 auths] [4 credenciales]    │     │
│       └────────────────────────────────────────────────────┘     │
├──────────────────────────────────────────────────────────────────┤
│  W2   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│       │Sesiones│ │ Notas  │ │ Unid.  │ │Clinical│               │
│       │  128   │ │   7    │ │  72%   │ │ 8/12   │               │
│       │ ▲12% ∿ │ │ ▼3  ∿  │ │ ▬▬▬▬░░ │ │ ▬▬▬░░░ │               │
│       └────────┘ └────────┘ └────────┘ └────────┘               │
├───────────────────────────────────────┬──────────────────────────┤
│  W3  Requiere atención                │  W4  Utilización auths   │
│  ● crítico  Auth #A-1024   en 3 días  │  Cliente A  ▬▬▬▬▬▬▬░ 91% │
│  ● grave    Cred. BCBA     en 12 días │  Cliente B  ▬▬▬▬▬░░░ 78% │
│  ● grave    Doc. seguro    en 19 días │  Cliente C  ▬▬▬▬░░░░ 64% │
│  ● leve     Doc. HR        en 44 días │                          │
│                          [Ver todos]  │           [Ver todas]    │
├───────────────────────────────────────┴──────────────────────────┤
│  W5  Sesiones — últimas 12 semanas    │  W6  Cumplimiento doc.   │
│      ╱╲    ╱╲                          │  ▓▓▓▓▓▒▒▒░░  entregados  │
│    ╱   ╲╱    ╲╱                        │  120 · 34 · 12 · 3       │
└───────────────────────────────────────┴──────────────────────────┘
```

---

## 8. Fases de implementación

### FASE 1 — Contrato, mock y costura *(sin UI)*
- `lib/types/dashboard.types.ts` con el contrato completo de §5.3.
- `dashboard.mock.ts` tipado, con los 4 escenarios de §5.2.2 y latencia simulada.
- `dashboard.service.ts` contra `GET /dashboard/summary`, con el mismo blindaje de `total`/`totalAmount` que ya aplicamos.
- `dashboard.source.ts` — el interruptor.
- `use-dashboard-summary.ts` — firma única.
- `utils/severity.ts` — umbrales y orden.
- **Verificación:** un test manual cambiando la env var; el hook devuelve la misma forma en ambos modos.

### FASE 2 — Primitivas de UI
`StatTile` (valor + delta + sparkline), `Meter`, `SeverityBadge` (icono + etiqueta, nunca color solo), `SectionCard` (extraído del patrón de Session Note), `HeroFigure`, `WidgetSkeleton`, `WidgetEmptyState`, `WidgetPendingBackend`.

> `SectionCard` se extrae a `components/custom/` porque ya está triplicado (Session Note, Clinical Monthly, y ahora Dashboard). Es deuda técnica que conviene pagar ahora.

### FASE 3 — Widgets W1–W4
Los de acción, que son los que dan el valor. Cada uno consume una sección opcional del contrato y resuelve sus tres estados: cargando / vacío / pendiente-de-backend.

### FASE 4 — Composición por rol
`useDashboardLayout()` decide qué widgets se montan según `usePermission()` y `memberUserTypes`.

### FASE 5 — Gráficas W5–W6
Con `recharts`, que ya es dependencia y ya tiene precedente en los datasheets. Aplicando §7.3 al pie de la letra.

### FASE 6 — Cierre ✅
Validador re-corrido con los colores finales (CVD ΔE 9.1 · visión normal ΔE 19.6 · advertencia de contraste cubierta con etiquetas directas) y repaso completo contra el catálogo de anti-patrones:

| Anti-patrón | Cómo se evitó |
| --- | --- |
| Doble eje | Sesiones y notas van como **small multiples**, cada una con su escala |
| Recolor al filtrar | El color sigue a la entidad/estado, nunca al orden de la fila |
| Ciclar hues más allá de 8 | Máximo 1 serie por gráfica |
| Elegir colores a ojo | Validador corrido, resultados anotados en `tokens.ts` |
| Dona o pie | Cumplimiento documental va como barra apilada |
| Gráfica de una sola barra | Los números de cabecera son stat tiles, no gráficas |
| Color de estado como serie | Única excepción documentada: "notas pendientes" **significa** algo malo |
| Más de ~7 clases de color | La lista de vencimientos es tabla; el desglose documental tiene 4 segmentos |

---

## 9. Criterios de aceptación

1. Cambiar `NEXT_PUBLIC_DASHBOARD_MOCK` alterna mock ↔ real **sin tocar un solo componente**.
2. Si una sección del contrato llega `undefined`, ese widget degrada y **el resto sigue funcionando**.
3. Ningún estado se comunica **sólo por color**: siempre icono + etiqueta.
4. Cero gráficas de doble eje. Cero donas.
5. El validador de paleta pasa en el modo en que se publique.
6. Los umbrales están en un archivo y cambiarlos no requiere tocar componentes.
7. Todos los widgets tienen los tres estados resueltos: cargando, vacío, error.
8. El RBT no ve utilización de autorizaciones ni cumplimiento documental de clientes.

---

## 10. Decisiones abiertas

1. **¿Un endpoint agregado o pegarle a cada módulo?** Recomiendo agregado (§5.4). Si backend no puede ahora, la costura permite arrancar con mock y decidir después sin costo.
2. **Credenciales**: ¿backend expone `NEAR_EXPIRATION` o lo derivamos? (§6.3)
3. **Umbrales**: ¿los de §6.1 sirven como punto de partida, o Miriam tiene números del negocio?
4. **`scope=me|company`**: ¿el analista ve toda la compañía o sólo sus clientes asignados?
5. **Vencimiento de contraseña**: ¿entra como widget, o como banner global fuera del dashboard? Me inclino por banner — es del usuario, no de la operación.
