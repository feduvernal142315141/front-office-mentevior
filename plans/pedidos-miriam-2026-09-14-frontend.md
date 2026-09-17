# Plan Frontend — Pedidos Miriam & Lidia 2026-09-14

Solo cambios que **no requieren modificaciones de backend**. Orden sugerido de ejecución.

---

## 1. M1 — Other Services obligatorio en Assessment (sin toggle PDF)

**Riesgo:** Ninguno. Cambio visual, no toca datos.

**Qué hacer:**
- En `AssessmentForm.tsx` (~línea 727-728): quitar el `<SectionPdfToggle>` del `headerAction`
  de la sección "Other Services" y quitar el `contentHidden={!formData.pdfFlags.showOtherServices}`.
- En `useAssessmentForm.ts`: forzar `showOtherServices: true` en el estado inicial y al
  construir el payload. Remover la validación `sectionBlocksSave` para esta sección (~línea 806).
- En `assessment.types.ts`: la flag `showOtherServices` sigue existiendo en el tipo (backend
  la espera), simplemente la fijamos a `true` siempre.

**Archivos:**
- `app/(app)/assessment/components/AssessmentForm.tsx`
- `app/(app)/assessment/hooks/useAssessmentForm.ts`

---

## 2. M7 — Línea discontinua después del Baseline

**Riesgo:** Ninguno. Solo visual.

**Estado actual verificado:** La phase line entre baseline y treatment **ya es dashed**
(`strokeDasharray="8 4"` en FrequencyChart.tsx ~línea 492-510), con label "Treatment" en pill negro.

**Qué verificar con Miriam:**
- ¿Quiere una línea separada DESPUÉS del último punto de baseline (antes del primer dato
  de treatment)? → Eso ya existe.
- ¿O quiere que la LÍNEA del baseline (la serie roja) sea discontinua? → Eso sería cambiar
  el `<Line>` del baseline de solid a dashed.

**Acción probable:** Si lo que pide es que la línea roja de baseline se vuelva discontinua
después del último baseline datapoint (o sea, que no se extienda sólida hasta el treatment):
- En `FrequencyChart.tsx`, `DurationChart.tsx`, `PercentageChart.tsx`, `RateChart.tsx`:
  aplicar `strokeDasharray` al segmento posterior del baseline o truncar la línea en el
  último dato real.

**Archivos:**
- `app/(app)/clients/[id]/configuration/components/datasheets/FrequencyChart.tsx`
- (y variantes Duration, Percentage, Rate)

---

## 3. L1 — Rango de fecha personalizado (Custom) en Charts

**Riesgo:** Bajo. Agrega funcionalidad, no modifica la existente.

**Qué hacer:**

### 3a. `useChartDateRange.ts`
- Agregar preset `"Custom"` al tipo `ChartRangePreset`
- Agregar estado `customStart: Date | null` y `customEnd: Date | null`
- Cuando preset = "Custom": `buildRange` usa las fechas custom en vez de calcular
- `setPreset("Custom")` no resetea el anchor, habilita el date picker
- Prev/Next deshabilitados en modo Custom (el rango es libre)
- `CHART_RANGE_PRESETS` pasa a incluir "Custom" al final

### 3b. `ChartDateRangeToolbar.tsx`
- Agregar botón "Custom" al final de los range presets
- Cuando Custom está activo: reemplazar el display de fecha (derecha) por un date-range
  picker con dos inputs (From / To) en vez del label estático + chevrons
- Reutilizar el `DatePicker` o `Popover+Calendar` de shadcn que ya usa el proyecto
- Los chevrons Prev/Next se ocultan o deshabilitan en modo Custom

**Archivos:**
- `app/(app)/clients/[id]/configuration/components/datasheets/useChartDateRange.ts`
- `app/(app)/clients/[id]/configuration/components/datasheets/ChartDateRangeToolbar.tsx`

---

## 4. L3 — Nombre del behavior con lápiz en Datasheet

**Riesgo:** Bajo. Agrega link/botón, no modifica datos.

**Qué hacer:**
- En cada datasheet (`FrequencyDatasheet.tsx`, `RateDatasheet.tsx`, etc.), el nombre del
  item ya se muestra en la cabecera. Agregar un ícono de lápiz (`Pencil` de lucide) al lado
  del nombre que al hacer clic abre el drawer de data collection del item en modo lectura,
  o navega a la configuración del service plan.
- La función `onOpen` ya se pasa como callback en `ReadOnlyItemChart`; reutilizar ese
  patrón en los datasheets. El destino es la pantalla de config del item
  (`/clients/{id}/configuration?spId={spId}&section=service-plan`).

**Archivos:**
- `app/(app)/clients/[id]/configuration/components/datasheets/FrequencyDatasheet.tsx`
- `app/(app)/clients/[id]/configuration/components/datasheets/RateDatasheet.tsx`
- `app/(app)/clients/[id]/configuration/components/datasheets/PercentageDatasheet.tsx`
- `app/(app)/clients/[id]/configuration/components/datasheets/DurationDatasheet.tsx`
- `app/(app)/clients/[id]/configuration/components/datasheets/IntervalDatasheet.tsx`
- `app/(app)/clients/[id]/configuration/components/datasheets/shared-datasheet-components.tsx`

---

## 5. M5 — BCBA arriba + proveedores externos separados

**Riesgo:** Medio. Cambia layout del assessment form, pero no modifica contrato de datos.

**Qué hacer:**
- El array `providerFiles` ya tiene un campo `type` por fila (string libre, e.g. "BCBA",
  "Psychiatry"). La estructura del payload al backend no cambia.
- **Opción A (recomendada):** Separar visualmente en `AssessmentForm.tsx`:
  - Sección nueva **"Evaluator"** (arriba, después de info del cliente): filtrar del array
    las filas donde `type` contiene "BCBA" y mostrarlas primero en una card separada.
  - Sección **"Other Providers"**: las filas restantes (Psychiatry, Speech, etc.)
  - Al guardar, re-combinar ambas listas en el array `providerFiles` del payload.
- **Opción B:** Simplemente reordenar las filas para que las de tipo BCBA vayan primero
  (sorting automático) sin separar en dos secciones.
- El prefill desde `assessment-data` ya trae los providers con su tipo; no hay cambio en
  la carga.

**Archivos:**
- `app/(app)/assessment/components/AssessmentForm.tsx`
- `app/(app)/assessment/components/sections/ProviderFilesSection.tsx`

---

## 6. M6 — Sidebar colapsable en Configuration

**Riesgo:** Medio. Cambio de layout, no toca lógica de datos.

**Qué hacer:**
- En `ClientConfigurationLayout.tsx`, la sidebar con "Service Plan" / "Data Collection"
  ocupa espacio fijo. Hacerla colapsable:
  - Estado `sidebarCollapsed: boolean` (default false)
  - Collapsed: solo iconos (sin texto), ancho ~60px
  - Expanded: ancho actual (~240px)
  - Botón toggle en la esquina de la sidebar
  - O alternativamente: convertir Service Plan / Data Collection en **tabs horizontales**
    arriba del contenido principal, eliminando la sidebar por completo.
- Confirmar con Miriam cuál prefiere (colapsable vs tabs) antes de implementar.

**Archivos:**
- `app/(app)/clients/[id]/configuration/components/ClientConfigurationLayout.tsx`

---

## Resumen de ejecución

| Orden | Pedido | Complejidad | Impacto |
|-------|--------|-------------|---------|
| 1 | M1 — Other Services sin toggle | Baja (~15 min) | Assessment |
| 2 | M7 — Verificar/ajustar phase line | Baja (~20 min) | Charts |
| 3 | L1 — Custom date range | Media (~1h) | Charts toolbar |
| 4 | L3 — Lápiz en datasheets | Baja (~30 min) | Datasheets |
| 5 | M5 — BCBA separado | Media (~45 min) | Assessment |
| 6 | M6 — Sidebar colapsable | Media (~45 min) | Configuration |
