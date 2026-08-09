# Landing Page de MenteVior — Relevamiento previo

> Fecha: 2026-08-08
> Estado: **análisis, sin propuesta todavía**
> Repos revisados: `front-office-mentevior` y `mente-vior` (backoffice)

Documento de trabajo. Reúne lo que existe hoy —marca, tokens, copy, arquitectura— para
que la propuesta de landing parta de hechos verificados en el código y no de supuestos.

---

## 1. Los dos productos

| | Front Office | Back Office |
| --- | --- | --- |
| Repo | `front-office-mentevior` | `mente-vior` |
| Usuario | Clínicas ABA (BCBA, RBT, analistas) | El equipo de MenteVior |
| Módulos | ~30 | 3 (organizations, dashboard, auth) |
| Stack | Next 16, Tailwind v4 CSS-first | Next, Tailwind v3 con config |
| Fuente | `font-sans` por defecto (ninguna importada) | Geist / Geist Mono |

El backoffice es el **plano de control multi-tenant**: da de alta organizaciones y les
asigna Service Plans. El modelo `Organization` incluye EIN, NPI, MPI y taxonomy code, o
sea que el onboarding de una clínica ya contempla el dato regulatorio real.

Existe `subscription_plan?: "basic" | "pro" | "enterprise"` en
`lib/types/organization.types.ts` del backoffice. Hay intención de planes, aunque no se
usa todavía. Relevante si la landing va a mostrar pricing.

---

## 2. Arquitectura multi-tenant — condiciona dónde vive la landing

Esto es lo primero a resolver:

- Cada clínica entra por `/{su-identificador}/login`
- El login muestra el **logo y el nombre de la clínica**, no el de MenteVior
  (`BrandSection.tsx` recibe `companyLogo` y `companyName` de `useCompanyConfig`)
- `proxy.ts` interpreta **cualquier segmento suelto como identificador de compañía** y
  redirige a `/<segmento>/login`
- La ruta `/` ya está ocupada por una pantalla "Company-Specific Access" que explica el
  formato de URL por organización

**Consecuencia:** `/` no está libre. Una landing en la raíz de ese dominio choca con la
pantalla de acceso y con el proxy. Decidir antes de diseñar:

- Dominio propio (`mentevior.com`) separado del app, o
- Convivencia en el mismo deploy, moviendo la pantalla actual a otra ruta

> ⚠️ `proxy.ts` mantiene una lista `APP_ROUTES` que hay que actualizar con cada ruta
> nueva de primer nivel. Si la landing agrega rutas públicas (`/pricing`, `/features`),
> también van acá o el proxy las trata como compañías.

---

## 3. La marca

### Logo — `public/logoMenteVior.png`

Emblema circular con cuatro símbolos superpuestos:

| Símbolo | Lectura |
| --- | --- |
| Cerebro | Cognición, mente |
| Mano que sostiene | Cuidado, acompañamiento |
| Pieza de rompecabezas | Autismo / ABA |
| Flecha ascendente | Progreso, avance |

Wordmark: **Mente** en índigo profundo + **Vior** en cian claro. Degradado cian → índigo.

**Hallazgo:** el archivo **no se referencia en ningún lado del código**. Es coherente con
el white-label —la app muestra la marca del cliente— pero significa que la marca
MenteVior hoy no tiene superficie propia. La landing sería su primer lugar real.

### 🟡 Tensión pendiente: cian vs índigo

El logo va de cian a **índigo/violeta oscuro**. La UI es enteramente **azul cian**: el
índigo del wordmark **no existe como token**. La landing va a poner logo y UI juntos por
primera vez y ahí se va a ver. Hay que decidir si se suma el índigo al sistema o se
ajusta el logo.

---

## 4. Sistema de diseño

Formalizado en `docs/design-prompt-datasheets.md` bajo *"BRAND SYSTEM (MUST FOLLOW
EXACTLY)"*, y aplicado consistentemente en toda la app.

### Color

| Token | Valor |
| --- | --- |
| Primary Blue | `#037ECC` |
| Secondary Blue | `#079CFB` |
| Tertiary Blue | `#5AC8FA` |
| Dark Accent | `#025f9a` |
| Background | `hsl(240 20% 99%)` — casi blanco, subtono frío |
| Card | `#FFFFFF` |
| Text Primary | `hsl(240 30% 15%)` |
| Text Muted | `hsl(240 10% 40%)` |
| Border | `hsl(240 20% 93%)` |
| Success | `hsl(142 71% 45%)` |
| Destructive | `hsl(0 72% 51%)` |
| **Gradiente de marca** | `#037ECC → #079CFB → #5AC8FA` |

Los tokens viven en `app/globals.css` como canales HSL sueltos (`--primary: 210 90% 56%`)
y se usan siempre como `hsl(var(--token))`, a propósito, para evitar bugs en Firefox y
Safari.

### Forma y textura

- **Radios:** cards 16–20px · botones e inputs 12px · badges 8px · pills `9999px`
- **Sombras:** card `0 1px 3px rgba(15,23,42,.04)` · elevada `0 8px 24px rgba(3,126,204,.12)`
- **Glass:** `bg-white/70 backdrop-blur-xl` para elementos flotantes
- **Premium inputs:** degradado blanco→gris, inset highlight, focus con glow azul y
  `translateY(-1px)`
- **Fondo de login:** degradado + radial de profundidad + **textura de ruido en SVG**
  al 1.8% de opacidad (`.login-background` en `globals.css`)
- **Micro-interacciones:** 200ms ease, `hover:-translate-y-0.5` como gesto recurrente

### Tipografía

El doc dice *"System font stack (Inter/SF Pro Display feel)"* — pero es una **intención,
no una decisión ejecutada**: el front-office no importa ninguna fuente. Para una landing
la tipografía es la mitad de la percepción de calidad. **Falta elegirla.**

Escalas definidas: título de página 30px bold con texto en gradiente · headers de sección
18–20px semibold · headers de tabla 12–13px semibold uppercase con `letter-spacing .05em`
· body 14px.

---

## 5. Copy que ya existe

En `app/(auth)/[companyIdentifier]/login/BrandSection.tsx`:

> ### Professional ABA Therapy Management
> Streamline your therapy sessions, manage patients, and coordinate your team with our
> HIPAA-compliant platform designed for excellence in Applied Behavior Analysis.

Tres pilares de confianza:

1. **HIPAA Compliant & Secure** — *Your patient data is encrypted and protected with enterprise-grade security*
2. **Role-Based Access Control** — *Granular permissions ensure everyone sees exactly what they need*
3. **Real-Time Scheduling** — *Drag-and-drop calendar with intelligent conflict detection*

Frases rotativas: *Empower your team · Streamline your sessions · Transform patient care ·
Coordinate with confidence*

No hay que inventar el mensaje desde cero. Hay que decidir si éste es el bueno.

---

## 6. Sustancia real — qué mostrar sin exagerar

Verificado en el código, no en un brochure:

**Clínico:** Data Collection (datasheets, on-site, charts, data analysis, raw data) ·
Session Notes por billing code 97153/97155/97156 con guías CASP y validación de extensión
· Service Plans configurables por compañía · Clinical Monthly · Monthly Supervisions ·
Case Supervision Log · Assessment · Service Log

**Operativo:** Scheduling · Prior Authorizations con control de unidades · Billing con
claims y payers · Credentials y documentos con vencimientos · Applicants · Agreements ·
Firmas de caregiver · Roles con permisos por módulo y acción · Dashboard con centro de
atención

**Lo que NO hay** (del análisis de ABA Matrix, ver §7): EVV, payroll, mileage, app móvil
nativa, integraciones con terceros. No conviene prometerlo.

---

## 7. Competencia — ABA Matrix (`abamatrix.com`)

Mismo producto, mismo mercado. Análisis del 2026-08-08.

**Posicionamiento:** *"designed from the ground up as a truly integrated system,
connecting scheduling to service delivery, documentation to billing and payroll, data
collection to treatment planning and outcomes, and supervision to compliance within a
single, unified platform."*

**Señales:** sin precio público (demo/trial obligatorio) · 4.9/5 sobre solo 23 reseñas en
GetApp · HIPAA verificado por The Compliance Group · Secured by Astra · **CASP Business
Affiliate** · integraciones con Gusto, ADP, Paychex y Claimable · web + Android + iOS.

**Sus features destacadas:** STO Analytics Tool *"powered by AI"* (equivale a
`docs/plan-auto-evaluacion-sto-backend.md`, ya planificado) y Graph Hub.

**Sus debilidades en reseñas:** velocidad y **personalización limitada**. Ahí hay una
grieta: la configurabilidad por compañía de MenteVior —Service Plans, Data Collection,
Template Documents, roles granulares— está mejor sostenida por la arquitectura que
"tenemos más módulos".

---

## 8. Decisiones pendientes antes de diseñar

1. **Dónde vive la landing** — dominio propio o convivencia con el multi-tenant
2. **Idioma** — la app está en inglés, los docs internos en español, el mercado es EE.UU.
3. **Qué pide el CTA** — demo, trial o contacto
4. **Pricing público o no** — ABA Matrix no lo publica; imitable o atacable
5. **Resolver la tensión cian/índigo** del logo contra la UI
6. **Elegir tipografía** — hoy no hay ninguna
7. **Certificaciones** — ¿MenteVior puede reclamar CASP Business Affiliate o una
   verificación HIPAA de tercero? Es el terreno donde ABA Matrix es fuerte

---

## 9. Fuentes

- `app/globals.css` — tokens, `.premium-input`, `.login-background`
- `docs/design-prompt-datasheets.md` §BRAND SYSTEM — sistema de diseño de referencia
- `app/(auth)/[companyIdentifier]/login/BrandSection.tsx` — copy y pilares actuales
- `app/page.tsx` — pantalla de acceso multi-tenant que ocupa `/`
- `proxy.ts` — ruteo por identificador de compañía
- `components/layout/nav-items.ts` — inventario de módulos
- `public/logoMenteVior.png` — logo (sin usar en código)
- [abamatrix.com](https://www.abamatrix.com/) · [GetApp](https://www.getapp.com/healthcare-pharmaceuticals-software/a/aba-matrix/)
