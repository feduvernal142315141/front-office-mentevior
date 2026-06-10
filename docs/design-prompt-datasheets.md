# DESIGN PROMPT — ABA Therapy Data Collection Module (Datasheets + On-site Collection)

## CONTEXT

Design a modern, premium data collection interface for **MenteVior**, a HIPAA-compliant ABA (Applied Behavior Analysis) therapy management platform. This module is used by Board Certified Behavior Analysts (BCBAs) and Registered Behavior Technicians (RBTs) to track behavioral data for children with autism. The interface must feel clinical yet approachable, data-dense yet clean, and optimized for daily use by therapists who enter data rapidly.

The app already exists with a collapsible sidebar (300px expanded / 80px collapsed), a sticky topbar with breadcrumbs, and uses Next.js + Tailwind CSS + shadcn/ui + Recharts + Framer Motion.

---

## BRAND SYSTEM (MUST FOLLOW EXACTLY)

### Colors
- **Primary Blue:** `#037ECC` (main CTAs, active states, gradients)
- **Secondary Blue:** `#079CFB` (gradient midpoint)
- **Tertiary Blue:** `#5AC8FA` (gradient endpoint, light accents)
- **Dark Accent:** `#025f9a` (badges, secondary actions)
- **Background:** `hsl(240, 20%, 99%)` — near-white with cool undertone
- **Card Surface:** `#FFFFFF` pure white
- **Text Primary:** `hsl(240, 30%, 15%)` — dark slate
- **Text Muted:** `hsl(240, 10%, 40%)` — medium gray
- **Border:** `hsl(240, 20%, 93%)` — subtle blue-gray
- **Success:** `hsl(142, 71%, 45%)` — green
- **Destructive:** `hsl(0, 72%, 51%)` — red
- **Gradient (brand):** `linear-gradient(to right, #037ECC, #079CFB, #5AC8FA)`

### Typography
- Font: System font stack (Inter/SF Pro Display feel)
- Page Title: 30px bold, gradient text (`bg-clip-text text-transparent bg-gradient-to-r from-[#037ECC] to-[#079CFB]`)
- Section Headers: 18-20px semibold, slate-800
- Table Headers: 12-13px semibold uppercase, slate-500, letter-spacing 0.05em
- Body/Data: 14px regular, slate-700
- Small Labels: 12px medium, slate-500

### Component Style
- **Border Radius:** Cards 16-20px, Buttons/Inputs 12px, Badges 8px, Pills 9999px
- **Shadows:** Cards `0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.02)`; Elevated `0 8px 24px rgba(3,126,204,0.12)`
- **Glass Morphism:** `bg-white/70 backdrop-blur-xl` for floating elements
- **Premium Inputs:** Gradient background (top white → bottom light gray), inset white highlight shadow, blue focus ring with glow (`0 0 0 4px rgba(3,126,204,0.12), 0 6px 14px rgba(3,126,204,0.18)`), subtle translateY(-1px) on focus
- **Hover transitions:** 200ms ease, scale or translateY micro-interactions
- **Active tab indicator:** Blue gradient background with white text, rounded-full pill shape

---

## SCREEN 1: DATASHEETS — Monthly Behavioral Data Entry + Live Chart

### Page Layout (Top to Bottom)

**1. TOP BAR AREA (sticky, inside main content)**
```
[← Back]  CLIENT Daniel Herrera  ›  Data  ›  Datasheets

Month: [◄] May 2026 [►]     (month picker with prev/next arrows)
```

**2. CATEGORY TABS (horizontal scrollable pills)**
```
[● Maladaptive Behaviors (13)]  [Replacement/Acquisition Programs (14)]  [Caregiver Programs (3)]
```
- Active tab: `bg-gradient-to-r from-[#037ECC] to-[#079CFB]` with white text, pill shape, subtle shadow
- Inactive tabs: `bg-white border border-slate-200` with slate-600 text, hover shows blue border
- Each tab shows category name + item count in parentheses
- Horizontally scrollable with fade-out edges if overflow

**3. ITEM NAVIGATION (inside active category)**
When a category is selected, show a horizontal scrollable list of items within that category:
```
[Property Destruction ●]  [Biting Others]  [Elopement]  [Tantrum]  [Screaming]  ...
```
- Active item: Underline with primary blue, bold text
- Or use a secondary pill style: lighter blue bg-[#037ECC]/8 with blue text
- This lets the user quickly switch between items without a full page reload

**4. ITEM HEADER CARD (white card, rounded-2xl, subtle shadow)**
A clean, compact header card for the selected item:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Property Destruction                          Category: Maladaptive     │
│  ● Active                                      Type: Frequency           │
│                                                                          │
│  Description:                                                            │
│  Any instance in which the onset involves Daniel engage in               │
│  knocking/breaking or dropping items on the floor...                     │
│                                                                          │
│  Baselines: 02/21/2025: 12/day, 02/17/2025: 13/day, 02/19/2025: 10/day │
│  Mastery Criteria: Daniel will reduce Property Destruction to near       │
│  zero for 6 consecutive sessions                                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Design notes:
- Item name: 22-24px semibold
- Status badge: green dot + "Active" small pill
- Category and Type: Displayed as subtle `label: value` pairs on the right, using slate-500 labels and slate-800 values
- Description: Collapsible with "Show more" if text is long, 14px text, slate-600
- Baselines: Small pills or inline badges with date:value format, blue-50 background
- Mastery Criteria: Highlighted in a subtle info box (blue-50 bg, blue-200 left border, blue icon)

**5. LIVE CHART (Recharts area/line chart — the star of the page)**

A beautiful, interactive chart that updates as the user enters data:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  20 ┤                                                                    │
│  18 ┤         ●───────●                                                  │
│  16 ┤        /         \                                                 │
│  14 ┤       /           \              ●                                 │
│  12 ┤──●───●  baseline   \           / \          ●───●                  │
│  10 ┤                     \    ●────●   \        /     \    ●            │
│   8 ┤                      \  /          \──●───●       \  / \           │
│   6 ┤                       ●             ┆              ●    \          │
│   4 ┤                                     ┆                    ●         │
│   2 ┤                                     ┆                              │
│   0 ┼───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬──    │
│     26  27  28  29  30  01  02  03  04  05  06  07  08  09  10  11       │
│                                           ┆                              │
│                              "started new school"                        │
│                              (env. change dashed line)                   │
│                                                                          │
│  Legend: ── Baseline (red)  ── Total (blue)  ┆ Env. Change (dashed gray) │
│                                                                          │
│  * Datapoints: 33, Total: 1 Decreasing (slope: -0.03, alpha: 9.50)      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Design notes for the chart:
- **Chart container:** White card, rounded-2xl, padding 24px, subtle border
- **Chart dimensions:** Full width, 280-320px height
- **Baseline line:** Red/coral dashed line (`#EF4444` or destructive color), with filled area underneath at 5% opacity
- **Data line:** Primary blue `#037ECC`, 2.5px stroke, smooth bezier curve, circle dots at each data point (6px), hover shows tooltip with date + value
- **Environmental change markers:** Vertical dashed gray lines (`#94A3B8`) with a small annotation label rotated or at the top, showing the text entered by the user (e.g., "started new school", "Daniel/school bus", "Mother out of town")
- **Objective/target line:** Green dashed horizontal line showing the mastery target
- **Grid:** Very subtle horizontal grid lines only (slate-100), no vertical grid
- **Axis labels:** X = dates (format: day number), Y = "Number of occurrences" rotated vertically
- **Legend:** Below chart, horizontal layout with colored lines + labels, small font
- **Statistics line:** Below legend, showing datapoints count, trend direction (Increasing/Decreasing/Stable), slope value
- **Animation:** Data points animate in with a spring effect when data is entered
- **Tooltip on hover:** Glass morphism tooltip showing: Date, Value, Weekly context

**6. DATA ENTRY TABLE (the core input area)**

This is where the magic happens. A horizontal scrollable table where each column = 1 day of the month:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│              │  1  │  2  │  3  │  4  │  5  │  6  │  7  │ W1  │  8  │  9  │ ... │ AVG│
│──────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼────│
│  # Occur.    │ [5] │ [3] │ [7] │ [2] │ [8] │ [4] │ [6] │  35 │ [3] │ [5] │     │    │
│  Initials    │ FH  │ FH  │ MR  │ FH  │ LK  │ FH  │ MR  │     │ FH  │ FH  │     │    │
│  Env.Changes │     │ txt │     │     │     │     │     │     │     │ txt │     │    │
│──────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴────│
│                                                              Weekly Total: 35         │
│                                                              Monthly Average: 5.0     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Table Design — PREMIUM APPROACH:**

Instead of a boring spreadsheet, design this as a modern data grid:

- **Row labels (left column, sticky):** "Number of occurrences", "Initials", "Environmental changes" — 13px semibold, slate-500, sticky on horizontal scroll with white background + shadow-right fade
- **Day columns:** Each 60-72px wide, centered content
  - **Day header:** Show day number (1-31) as primary label, show abbreviated weekday below in smaller text (Mon, Tue...). Weekend columns have a very subtle warm-gray background tint (`slate-50`)
  - **Today's column:** Highlighted with a soft blue top border (3px, primary gradient) and very subtle blue-50 background tint
- **Input cells for "Number of occurrences":**
  - Mini premium inputs: 48px × 36px, centered number, rounded-lg (10px)
  - Default state: very subtle border (slate-200), white background
  - On hover: slight elevation shadow
  - On focus: blue border + glow ring (matching premium-input style but compact)
  - Has data: Slightly bolder font weight, slate-800 color
  - Empty: Light slate-300 placeholder showing "—"
  - **Validation:** Only whole numbers, no decimals, no negatives
- **Input cells for "Initials":**
  - Text input: 48px × 28px, uppercase, max 3 characters, centered
  - Subtle style, smaller font (12px), slate-600
- **Input cells for "Environmental changes":**
  - When empty: Show a small icon button (pencil or note icon, 20px, slate-400)
  - On click: Expand to a small popover/tooltip input with a textarea (160px wide) that says "Describe environmental change..."
  - When has data: Show a small indicator dot (blue) or truncated text with tooltip on hover showing the full text
  - This keeps the table compact while still allowing rich text entry

- **Weekly Total columns:** Every 7 days, insert a subtotal column with:
  - Slightly wider (72px)
  - Background: `bg-gradient-to-b from-blue-50/60 to-white`
  - Bold number, primary blue color
  - Label "W1", "W2", "W3", "W4", "W5" at the top

- **Monthly Average (last column, sticky right):**
  - Sticky on the right side with shadow-left fade
  - Background: Gradient blue-50
  - Bold number, primary blue, 16px
  - Label "AVG" at top

- **Scroll behavior:** Horizontal scroll with momentum, row labels sticky-left, summary sticky-right. Show subtle scroll indicators/shadows at the edges when content overflows.

- **Quick actions row (optional but premium):**
  - At the bottom of the table, a subtle row with quick-fill options:
    - "Copy previous week" button
    - "Mark all as 0" for blank days
    - "Auto-fill initials" from the most recent entry

**7. FOOTER AREA**
```
[💬 Comments section — expandable textarea]
[✍️ Add Signature — button that opens signature pad modal]
[🖨️ Print / Export PDF — secondary button]
```

### Responsive Behavior
- On smaller screens (< 1280px): Chart stacks above table, both full-width
- On wide screens (≥ 1440px): Consider a side-by-side layout where chart is on the right and table on the left, both updating in real-time as a split view
- Category and Item tabs become scrollable with arrows

---

## SCREEN 2: ON-SITE COLLECTION — Real-time Session Counter

### Page Layout

**1. TOP BAR**
```
[← Back]  CLIENT Daniel Herrera  ›  Data  ›  On-site Collection (05/27/2026)

Session Timer:  [▶ Start]  00:00:00     [📋 Session Summary]  [💾 Save & Close]
```
- The session timer is a prominent element — shows elapsed time since session started
- Start/Pause/Stop controls
- Save & Close saves all collected data to the session

**2. CATEGORY TABS (same style as Datasheets)**
```
[● Maladaptive Behaviors (13)]  [Replacement/Acquisition Programs (14)]  [Caregiver Programs (3)]
```

**3. SEARCH BAR**
```
[🔍 Search items...]
```
Filters the visible cards in real-time by item name.

**4. BEHAVIOR COUNTER CARDS GRID**

A responsive grid of cards (3 columns on desktop, 2 on tablet, 1 on mobile):

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│  📝  BITING OTHERS    ℹ │  │  📝  BOLTING           ℹ │  │  📝  CLIMBING         ℹ │
│      FREQUENCY           │  │      FREQUENCY           │  │      FREQUENCY           │
│                          │  │                          │  │                          │
│    ┌───┐  ┌────┐  ┌───┐ │  │    ┌───┐  ┌────┐  ┌───┐ │  │    ┌───┐  ┌────┐  ┌───┐ │
│    │ − │  │  0 │  │ + │ │  │    │ − │  │  3 │  │ + │ │  │    │ − │  │  0 │  │ + │ │
│    └───┘  └────┘  └───┘ │  │    └───┘  └────┘  └───┘ │  │    └───┘  └────┘  └───┘ │
│                          │  │                          │  │                          │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

**Card Design — PREMIUM VERSION:**

Each card should be a mini interaction hub:

- **Card container:** White, rounded-2xl (16px), border slate-200, padding 20px
  - **Default state:** Subtle shadow, clean
  - **Has data (count > 0):** Left border accent: 3px solid primary blue gradient. Slightly elevated shadow. The count number glows subtly.
  - **Hover:** Scale 1.01, shadow increases slightly

- **Header row:**
  - Left: Edit icon (pencil, 16px, slate-400) — for editing item details
  - Center: Item name in ALL CAPS, 14-15px semibold, slate-800, truncated with ellipsis if too long
  - Right: Info icon (ℹ circle, 16px, slate-400) — opens a popover with item description, baselines, mastery criteria

- **Type badge:** Below the name, centered, 11px uppercase, tracking-wider, slate-500 (e.g., "FREQUENCY")

- **Counter section (the main interaction):**

  For **FREQUENCY** type:
  ```
      ┌────────┐    ┌──────────┐    ┌────────┐
      │   −    │    │    12    │    │   +    │
      │  (red) │    │  (big#)  │    │ (blue) │
      └────────┘    └──────────┘    └────────┘
  ```
  - **Minus button:** 48×48px circle or rounded-xl, `bg-red-50 hover:bg-red-100 active:bg-red-200`, icon in `text-red-500`, ripple effect on press. Disabled (opacity 40%) when count is 0.
  - **Counter display:** 56×48px rounded-xl, `bg-slate-50 border border-slate-200`. Number is 24-28px bold, centered, slate-800 when 0, primary blue (`#037ECC`) when > 0. The number should animate (spring) when incremented/decremented.
  - **Plus button:** 48×48px circle or rounded-xl, `bg-blue-50 hover:bg-blue-100 active:bg-blue-200`, icon in `text-[#037ECC]`, ripple effect on press.
  - **All three** should be large enough for easy thumb tapping on tablets

  For **PERCENTAGE** type:
  ```
      ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
      │ Y │ │ N │ │ Y │ │ Y │ │ N │ │ Y │ │ N │ │ Y │ │ Y │ │ N │  → 60%
      │#1 │ │#2 │ │#3 │ │#4 │ │#5 │ │#6 │ │#7 │ │#8 │ │#9 │ │#10│
      └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘
  ```
  - Trial toggles: Each 36×36px rounded-lg
  - **Yes state:** `bg-green-500 text-white` with checkmark or "Y"
  - **No state:** `bg-red-100 text-red-600` with "N"
  - **Unset state:** `bg-slate-100 border border-slate-200 text-slate-400` with trial number
  - **Percentage display:** Right side or below, large 20px bold, primary blue, showing calculated `%`
  - Total trials configured per item from service plan (e.g., 10 trials = 10 toggle buttons)
  - Trial buttons use `[-]` to remove last trial and `[+]` to add a new trial (flexible trial count)

- **Card footer (subtle):**
  - Micro text: "Last updated: 2:34 PM" or empty if no data yet
  - Optional: small sparkline showing today's trend (tiny 40px wide × 16px tall line chart)

**5. FLOATING SESSION SUMMARY BAR (bottom of screen)**

A floating bar anchored to the bottom of the viewport:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⏱ 01:23:45  │  📊 Items recorded: 8/13  │  🔴 Highest: Biting (12)  │  [Save ▶]  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- `backdrop-blur-xl bg-white/80 border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]`
- Shows: Session timer, items with data count / total items, highest behavior, prominent Save button (primary gradient)

---

## INTERACTION PATTERNS & MICRO-ANIMATIONS

1. **Data entry in Datasheets:** When a number is entered, the chart point animates in with a spring bounce. The weekly total recalculates with a counting animation (number rolls up/down).

2. **Counter press in On-site:** The counter number scales up briefly (1.15x) with a spring animation, then settles back. The card gets a brief blue pulse glow on the border. Haptic feedback on mobile.

3. **Environmental change entry:** When saved, a new dashed line animates onto the chart from top to bottom with a subtle fade-in.

4. **Category tab switch:** Content slides in from the right with a 200ms ease transition.

5. **Monthly average recalculation:** Number morphs (counter animation) when new data changes the average.

6. **Card grid entry animation:** Cards animate in with a staggered fade-up (50ms delay between each card) when the category changes.

---

## COLOR USAGE RULES

- **Data lines on charts:** Primary blue `#037ECC` for actual data, red `#EF4444` for baselines, green `#22C55E` for objectives/targets, gray dashed `#94A3B8` for environmental changes
- **Counter states:** Blue tints for positive actions (increment), red tints for reduction/decrement
- **Weekly/Monthly totals:** Primary blue text on blue-50 background
- **Empty states:** Slate-300 dashes or placeholder text
- **Error states:** Red-500 borders with red-50 backgrounds
- **Success feedback:** Brief green flash or checkmark animation when data saves

---

## COMPONENT SPECIFICATIONS

### Premium Data Cell (for the Datasheet table)
```
Width: 60-72px
Height: 36px (number) / 28px (initials) / 24px (env changes icon)
Border-radius: 10px
Background: linear-gradient(180deg, hsl(240 20% 99.5%) 0%, hsl(240 18% 97%) 100%)
Border: 1px solid hsl(240 20% 90% / 0.6)
Focus: border-color #037ECC, box-shadow 0 0 0 3px rgba(3,126,204,0.12)
Font: 14px semibold, centered, tabular-nums (monospaced numbers)
Transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Counter Button (for On-site)
```
Size: 48×48px
Border-radius: 14px
Background (plus): bg-blue-50 → hover bg-blue-100 → active bg-blue-200
Background (minus): bg-red-50 → hover bg-red-100 → active bg-red-200
Icon size: 24px, stroke-width 2.5
Shadow: 0 1px 2px rgba(0,0,0,0.04)
Active: scale(0.95) transform, shadow inset
Transition: 150ms ease
```

### Counter Display (for On-site)
```
Width: 56px (auto-expands for 3+ digits)
Height: 48px
Border-radius: 14px
Background: hsl(240 20% 97%)
Border: 1px solid hsl(240 20% 90%)
Font: 28px bold, tabular-nums
Color (zero): slate-400
Color (has data): #037ECC
Animation: spring({ stiffness: 500, damping: 25 }) on value change
```

### Category Pill Tab
```
Height: 36-40px
Padding: 0 16px
Border-radius: 9999px (full round)
Active: bg-gradient-to-r from-[#037ECC] to-[#079CFB], text white, shadow-md
Inactive: bg-white, border 1px solid slate-200, text slate-600
Hover (inactive): border-[#037ECC]/30, text-[#037ECC]
Font: 13px semibold
Transition: all 200ms ease
```

---

## WHAT TO DESIGN (Deliverables)

Please create high-fidelity mockups for these screens:

1. **Datasheets — Full Page View (Desktop 1440px+)**
   - Show: Category tabs, Item sub-tabs, Item header card, Live chart with real data points + baseline + env change line, Data entry table with 2 weeks of sample data filled, weekly totals, monthly average, initials row, environmental changes row
   - State: Item "Property Destruction" selected, Frequency type, some data entered, chart reflecting the data

2. **Datasheets — Data Entry Focus (close-up of the table area)**
   - Show the premium input cells in different states: empty, focused, filled, error
   - Show the environmental changes popover/tooltip open on one cell
   - Show the weekly total column highlighted
   - Show today's column highlighted

3. **On-site Collection — Counter Grid (Desktop)**
   - Show: 13 Maladaptive Behavior cards in a 3-column grid
   - Mix of states: some at 0, some with counts (3, 7, 12), show the highest count card with emphasis
   - Show the floating session summary bar at the bottom
   - Show the session timer running

4. **On-site Collection — Percentage Type (Desktop)**
   - Show cards with Yes/No trial toggles instead of counters
   - Mix of states: some trials answered, some pending
   - Show calculated percentage on each card

5. **On-site Collection — Mobile/Tablet View (iPad)**
   - 2-column card grid
   - Larger touch targets
   - Floating bottom bar adapted for touch

---

## DO NOT

- Do not use the old X-mark stacking system for counting occurrences
- Do not make the table look like a boring Excel spreadsheet — every cell should feel premium
- Do not use harsh borders — keep everything soft and elevated with shadows
- Do not put the chart on a separate page — chart and data entry must coexist on the same screen
- Do not use a plain HTML table — use a modern CSS grid with custom cell components
- Do not forget the glass morphism effects on floating elements
- Do not use any color that is not in the brand system defined above
