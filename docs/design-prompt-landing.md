# DESIGN PROMPT — MenteVior Marketing Landing Page

> Para pasar a una herramienta de diseño (v0, Lovable, Figma AI, etc.)
> Fecha: 2026-08-10 · Base: `plans/landing-page.md`
> Stack destino: **Astro 5 + Tailwind v4**, cero JS por defecto, islas React sólo donde haga falta

---

## 0. CONTEXT

Design the **marketing landing page for MenteVior**, an all-in-one, HIPAA-compliant
practice management and clinical documentation platform built specifically for **ABA
(Applied Behavior Analysis) therapy practices** in the United States.

**Who visits this page**

- Clinic owners and clinical directors of ABA practices (5–200 staff)
- BCBAs (Board Certified Behavior Analysts) evaluating tools for their team
- Solo practitioners starting a practice

They are clinicians and operators, **not** developers. They are busy, skeptical of
software promises, and burned by tools that fragment their work across five systems.

**What the page must do**

1. Make it obvious in 5 seconds what MenteVior is and who it's for
2. Prove the product is real and deep — this is a mature system, not a landing for a
   product that doesn't exist yet
3. Earn trust on security and compliance
4. Drive one action: **Request a demo**

**Traffic context:** a meaningful share will arrive from **Google Ads**. Page speed and
above-the-fold clarity affect Quality Score and cost per click. The design must not
depend on heavy imagery or large JS bundles.

---

## 1. BRAND SYSTEM (MUST FOLLOW EXACTLY)

### 1.1 Core palette

These are the product's real tokens. Do not substitute or "improve" them.

| Role | Hex | Notes |
| --- | --- | --- |
| **Primary Blue** | `#037ECC` | Main CTAs, active states, links |
| **Secondary Blue** | `#079CFB` | Gradient midpoint |
| **Tertiary Blue** | `#5AC8FA` | Gradient endpoint, light accents |
| **Dark Accent** | `#025F9A` | Hover on primary, dense badges |
| **Brand gradient** | `linear-gradient(90deg, #037ECC, #079CFB, #5AC8FA)` | Headline text fills, thin rules |

### 1.2 Deep Indigo — support color (NEW, use it)

The MenteVior logo runs from cyan to a **deep indigo**, but the product UI is entirely
cyan-blue. This landing is the first place logo and interface appear together, so the
indigo is introduced here as the **dark-section color**.

| Role | Hex |
| --- | --- |
| **Indigo 900** (dark section background) | `#2A2D6B` |
| **Indigo 800** | `#343878` |
| **Indigo 700** (on-dark borders) | `#454A93` |

Use indigo **only** for full-bleed dark sections (security, final CTA, footer). Never for
buttons, never as a second accent next to cyan. It is a ground, not an accent.

### 1.3 Neutrals

| Role | Value |
| --- | --- |
| Page background | `hsl(240 20% 99%)` — near-white, cool undertone |
| Alternate section background | `hsl(240 18% 97%)` |
| Card surface | `#FFFFFF` |
| Text primary | `hsl(240 30% 15%)` |
| Text secondary | `hsl(240 12% 32%)` |
| Text muted | `hsl(240 10% 45%)` |
| Border | `hsl(240 20% 93%)` |
| Border strong | `hsl(240 18% 87%)` |

### 1.4 Status colors (only for product UI mockups inside the page)

| Role | Value |
| --- | --- |
| Success | `hsl(142 71% 45%)` |
| Warning | `hsl(38 92% 50%)` |
| Critical | `hsl(0 72% 51%)` |

### 1.5 Signature texture

The product's auth screens use a very specific background treatment. **Reproduce it** on
the hero and on light section backgrounds — it is a brand signature, not decoration:

1. Base: `linear-gradient(135deg, hsl(240 20% 98%), hsl(240 18% 99%) 50%, hsl(240 20% 98%))`
2. Depth: `radial-gradient(ellipse 1400px 900px at 35% 50%, rgba(148,163,184,0.30), transparent 65%)`
3. Grain: fractal-noise SVG at **1.8% opacity**, tiled

The grain is what makes it feel expensive. Keep it subtle — it should be felt, not seen.

---

## 2. TYPOGRAPHY

The product has **no typeface chosen yet**. This prompt sets it.

### 2.1 Family

**Inter Variable** for everything. Single family, hierarchy through size, weight and
tracking. Enable optical sizing and `font-feature-settings: "cv11", "ss01"`.

> Rationale: the existing design system already targets an "Inter / SF Pro Display feel".
> One well-tracked grotesque reads more premium than a mismatched pairing, and one
> variable font is one network request.

*Alternative if more distinction is wanted:* headings in **Instrument Sans** (700),
body in Inter. Do not mix two similar grotesques.

### 2.2 Scale

Fluid via `clamp()`. Values are mobile → desktop.

| Token | Size | Weight | Tracking | Line height |
| --- | --- | --- | --- | --- |
| Display (hero H1) | 40 → 68px | 700 | `-0.035em` | 1.05 |
| H2 (section) | 30 → 44px | 700 | `-0.025em` | 1.15 |
| H3 (card title) | 19 → 21px | 600 | `-0.01em` | 1.3 |
| Body Large (hero sub) | 17 → 20px | 400 | `0` | 1.6 |
| Body | 16px | 400 | `0` | 1.65 |
| Small | 14px | 400 | `0` | 1.6 |
| Eyebrow / label | 12 → 13px | 600 | `0.08em` UPPERCASE | 1.2 |
| Button | 15px | 600 | `-0.01em` | 1 |

### 2.3 Rules

- **Headlines never exceed 3 lines.** Balance with `text-wrap: balance`.
- Paragraph measure: **max 68 characters** (`max-w-[62ch]`).
- Gradient text fill (`#037ECC → #079CFB → #5AC8FA`) is allowed on **at most two**
  headlines in the whole page. Overused it looks like a template.
- Numbers in stats use `tabular-nums`.

---

## 3. SPACING & LAYOUT

### 3.1 Grid

- Base unit: **8px**. Every spacing value is a multiple.
- Container: `max-width: 1200px`, centered
- Gutters: 24px mobile, 32px tablet, 48px desktop
- Columns: 12-col desktop, 6-col tablet, 4-col mobile
- Column gap: 24px mobile → 32px desktop

### 3.2 Vertical rhythm

| Element | Mobile | Desktop |
| --- | --- | --- |
| Section padding (top/bottom) | 72px | 128px |
| Hero padding top | 96px | 160px |
| Space after H2 | 16px | 20px |
| Space H2 block → content | 40px | 56px |
| Card internal padding | 24px | 32px |
| Grid gap between cards | 20px | 24px |

**Do not compress vertical space.** Generous breathing room is the single biggest driver
of "premium" perception in B2B SaaS.

### 3.3 Shape

| Element | Radius |
| --- | --- |
| Large feature panels | 24px |
| Cards | 20px |
| Buttons, inputs | 12px |
| Badges | 8px |
| Pills, avatars | `9999px` |

### 3.4 Elevation

| Level | Shadow |
| --- | --- |
| Card at rest | `0 1px 3px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.02)` |
| Card hover | `0 8px 24px rgba(3,126,204,.12)` |
| Floating / product mockup | `0 28px 72px -16px rgba(15,23,42,.10), 0 10px 32px -10px rgba(15,23,42,.06)` |

Borders are `1px solid hsl(240 20% 93%)`. **Never** use a shadow to fake a border.

---

## 4. PAGE STRUCTURE

Twelve sections, in this order.

### 4.1 Navigation (sticky)

- Height 72px. `bg-white/70 backdrop-blur-xl`, bottom border `hsl(240 20% 93%)`,
  appears only after 24px of scroll (transparent over hero at rest).
- Left: MenteVior logo (circular emblem + wordmark), 36px tall
- Center: Product · Features · Security · Pricing · Resources
- Right: "Sign in" (ghost, text-only) + **"Request a demo"** (primary, solid)
- Mobile: hamburger → full-screen sheet, links at 20px, CTA pinned at the bottom

### 4.2 Hero

Two-column on desktop (55% text / 45% visual), stacked on mobile.

**Left column**

- Eyebrow pill: `Built for ABA practices` — cyan tint background `#037ECC/8`, cyan text, 1px cyan border at 20% alpha
- H1: **`Every part of your ABA practice, finally in one place`**
  - Apply the brand gradient to *"in one place"* only
- Sub (Body Large, muted): *Data collection, session notes, supervision, authorizations
  and billing — connected end to end, so your team documents once and everything else
  follows.*
- CTA row: primary **"Request a demo"** + secondary ghost **"See how it works"** with a play icon
- Below CTAs, a thin trust line (Small, muted) with 3 inline items separated by `·`:
  `HIPAA compliant` · `Role-based access` · `Built with BCBAs`

**Right column — the product visual**

This is the most important asset on the page. Do **not** use a stock photo of a
therapist. Render a **stylized product composition**:

- A floating browser frame (rounded 24px, the "floating" shadow above) showing the
  **Data Collection screen with a live behavior chart** — a line/area chart in `#037ECC`
  with a soft gradient fill fading to transparent
- Two smaller cards overlapping the frame at the edges, offset and rotated ~2°:
  - A **stat tile**: "Sessions this week · 128" with a small sparkline
  - A **compliance badge card**: "Supervision · 12.4% · Met" with a green pill
- Behind everything, a soft radial cyan glow at 8% opacity
- All UI inside the mockup must follow the product's real design system (radii, shadows,
  the cyan palette, muted labels in uppercase 12px)

### 4.3 Trust bar

Slim strip, alternate background, 56px tall content.

Left-aligned label: `Trusted by ABA teams across the U.S.` followed by placeholder
client logo slots (grayscale, 24px tall, 40% opacity).

> ⚠️ **Use neutral placeholder shapes.** Do not invent or render real clinic names or
> logos.

### 4.4 The problem (short, honest)

Centered, single column, `max-w-[720px]`.

- Eyebrow: `The real cost of fragmentation`
- H2: **`Five systems. One clinician. Nothing reconciles.`**
- Paragraph: data in one tool, notes in another, authorizations in a spreadsheet,
  billing somewhere else. Errors surface at the claim, weeks later.
- Below: three small stat-style cards — *hours re-entering data* · *claims denied for
  documentation* · *authorizations expiring unnoticed*. Leave the numbers as
  `——` placeholders; do not fabricate statistics.

### 4.5 Feature pillars — three alternating rows

Each row: text on one side, product visual on the other, alternating direction. Vertical
space between rows: 96px desktop.

**Row 1 — Clinical documentation**
- Eyebrow `Clinical` · H2 **`Documentation that matches how ABA actually works`**
- Body: session notes per billing code (97153, 97155, 97156) with CASP-aligned guidance
  built into each field, treatment plans, assessments, and clinical monthly reports
- Bullets (icon + label + one line): *CASP-aligned templates* · *Per-code note formats* ·
  *Caregiver signatures* · *Generated PDFs*
- Visual: session note form with a floating guidance overlay and a live word counter

**Row 2 — Data collection & outcomes**
- Eyebrow `Data` · H2 **`Collect data fast. See progress instantly.`**
- Body: datasheets, on-site counters, automatic graphing, raw data and analysis
- Visual: the datasheet grid with the live chart beside it
- This is the differentiator — give this row the largest visual

**Row 3 — Operations & revenue**
- Eyebrow `Operations` · H2 **`Authorizations, scheduling and billing that talk to each other`**
- Body: scheduling with conflict detection, prior authorization unit tracking, claims and
  payers, credential and document expiration tracking
- Visual: the dashboard's authorization utilization meters + expiring list

### 4.6 Supervision & compliance

Full-width panel, background `hsl(240 18% 97%)`, radius 32px, inset within the container.

- H2: **`Supervision and compliance, documented by default`**
- Three columns: *Monthly supervision reports* · *Case supervision logs with coverage %*
  · *Credential and document expiration alerts*
- Include a small visual of the compliance meter showing a percentage and a `Met` pill

### 4.7 Configurability — the wedge

- Eyebrow `Built to fit` · H2 **`Configured to your clinic, not the other way around`**
- Body: service plans, data collection methods, document templates and role permissions
  are configured per organization
- Visual: a permissions matrix / configuration panel
- This section exists because the main competitor's weakness is limited customization.
  It should feel confident and concrete, not defensive. **Never name a competitor.**

### 4.8 Security — dark section

Full-bleed, background **Indigo 900 `#2A2D6B`**, white text.

- H2: **`Built for the data you're responsible for`**
- Three or four cards with `bg-white/5`, `border-white/10`, radius 20px, icon in
  `#5AC8FA`: *HIPAA compliant* · *Role-based access control* · *Encrypted in transit and
  at rest* · *Full audit trail*

> ⚠️ **Certifications are pending confirmation.** Render only the HIPAA claim and generic
> security statements. Do **not** invent third-party audit seals, certification badges,
> compliance logos, or affiliate marks.

### 4.9 Pricing — structure without numbers

Three cards, middle one elevated and marked `Most popular` (cyan pill, offset above the
card edge, card lifted 12px with a stronger shadow and a 1px cyan border).

| Tier | Positioning |
| --- | --- |
| **Basic** | Solo practitioners and new practices |
| **Pro** | Growing clinics with a team |
| **Enterprise** | Multi-site organizations |

Each card: tier name, one-line positioning, `Custom pricing` where the number would go, a
feature list with cyan check icons, and a `Request a demo` button (ghost on the outer
cards, solid on the middle one).

Below the grid, one muted line: *Pricing is tailored to your practice size and services.*

### 4.10 Testimonial

Single centered quote, `max-w-[820px]`. Quote at 24–28px, weight 500, tracking `-0.015em`.
Attribution below in Small muted: role and practice type only.

> ⚠️ Use clearly generic placeholder text and a neutral avatar shape. Do not fabricate a
> named person, clinic, or quote.

### 4.11 Final CTA

Full-bleed, **Indigo 900** background with a soft cyan radial glow at 12% opacity in the
upper right.

- H2 (white, centered): **`See MenteVior with your own workflows`**
- Sub: a 30-minute walkthrough with someone who knows ABA operations
- Primary button in white with indigo text; secondary ghost with a white border
- Below: `No credit card · No setup fee to evaluate`

### 4.12 Footer

Indigo 900, four columns: logo + one-line description · Product · Company · Legal.
Bottom bar with `© 2026 MenteVior` and Privacy / Terms / HIPAA Notice.
Divider `1px solid rgba(255,255,255,.08)`.

---

## 5. COMPONENT SPECS

### Primary button
- Background `#037ECC`, white text, 15px/600, height 48px, padding `0 24px`, radius 12px
- Hover: background `#025F9A`, `translateY(-1px)`, shadow `0 8px 20px rgba(3,126,204,.28)`
- Transition 200ms `cubic-bezier(.4,0,.2,1)`
- Focus: `0 0 0 4px rgba(3,126,204,.20)`

### Secondary / ghost button
- Transparent, `1px solid hsl(240 18% 87%)`, text primary, same dimensions
- Hover: `border-color: #037ECC`, `color: #037ECC`, background `#037ECC/4`

### Feature card
- White, radius 20px, `1px solid hsl(240 20% 93%)`, padding 32px, card shadow
- Icon: 44px rounded-xl container, background `#037ECC/10`, icon 20px in `#037ECC`
- Hover: `translateY(-2px)` + hover shadow, 200ms

### Eyebrow pill
- Background `#037ECC/8`, `1px solid #037ECC/20`, text `#037ECC` 12px/600 uppercase
  tracking `.08em`, padding `6px 12px`, radius `9999px`

---

## 6. MOTION

- Entrance: fade + `translateY(12px)`, 500ms `cubic-bezier(.16,1,.3,1)`, triggered on
  scroll into view at 15% visibility
- Stagger between siblings: 70ms
- Hover: 200ms ease-out, max `translateY(-2px)`
- **No parallax. No auto-playing carousels. No counters animating on scroll.**
- Every animation must respect `prefers-reduced-motion: reduce`
- Total JS for animation should be near zero — prefer CSS

---

## 7. RESPONSIVE

| Breakpoint | Behavior |
| --- | --- |
| `< 640px` | Single column. Hero visual below text, cropped to 280px tall. Nav collapses. |
| `640–1023px` | Two-column cards, hero still stacked |
| `1024–1439px` | Full layout, container 1120px |
| `≥ 1440px` | Container caps at 1200px; only whitespace grows |

Touch targets minimum 44×44px. Hero H1 must never exceed 4 lines on a 360px screen.

---

## 8. ACCESSIBILITY

- Body text contrast ≥ 4.5:1; large text ≥ 3:1
- On indigo `#2A2D6B`, only white or `#5AC8FA` for text — never `#037ECC`
- Every icon paired with a text label; never color as the sole carrier of meaning
- Visible focus ring on all interactive elements
- One `<h1>` per page, no skipped heading levels

---

## 9. DO NOT

- ❌ Stock photos of doctors, therapists, or children
- ❌ Invented certification badges, audit seals or partner logos
- ❌ Fabricated statistics, client names, or testimonials
- ❌ Naming or comparing against a competitor
- ❌ Purple/violet accents, neon gradients, dark-mode-first styling
- ❌ Gradient blobs floating in every section (the brand gradient is for text and thin rules)
- ❌ Emoji as icons — use a consistent line-icon set (Lucide)
- ❌ Generic AI-SaaS copy: "revolutionize", "unleash", "supercharge", "game-changing"
- ❌ Claiming features the product doesn't have: **no payroll, no mileage tracking, no
  electronic visit verification, no native mobile app, no third-party integrations**

---

## 10. TONE

Clinical confidence. The reader is a professional responsible for children's care and for
a payroll. Speak plainly, be concrete, show the product. Every claim should be something
a BCBA could verify in a demo fifteen minutes later.

The feeling to aim for: **calm, precise, and clearly built by people who understand ABA** —
closer to a medical device interface than to a startup landing page.
