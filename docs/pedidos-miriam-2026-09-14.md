# Pedidos Miriam & Lidia — 2026-09-14

Fuente: `14:09:26PedidosMiriran.docx`

---

## PEDIDOS DE LIDIA (NUEVOS)

### L1. Rango de fecha personalizado en Charts

**Pantalla:** Visor de gráficas del cliente (`/clients/[id]/charts`)
**Screenshot:** Charts toolbar con presets 1W/2W/1M/3M/6M + Daily/Weekly/Monthly

**Pedido:** Añadir un tab "Custom" al lado de "Monthly" en el toolbar de las gráficas.
Al activarlo, el control de la derecha (donde hoy dice "2026") cambia a un date-range
picker donde la analista selecciona fecha inicio y fecha fin libremente.

**Detalle:**
- Hoy el rango está rígido: solo presets fijos (1W, 2W, 1M, 3M, 6M) o año completo en Monthly.
- Quieren poder elegir, por ejemplo, "del 15 de julio al 30 de agosto" para analizar un
  período específico.
- El tab "Custom" al activarse habilita un calendario en la zona derecha del toolbar para
  poner el rango deseado.

**Componentes afectados:**
- `useChartDateRange.ts` — agregar preset "Custom" con start/end libres
- `ChartDateRangeToolbar.tsx` — nuevo tab + date range picker cuando Custom está activo

---

### L2. MPI y NPI del proveedor en el Service Log

**Pantalla:** Service Log (PDF generado)
**Screenshot:** Cabecera del Service Log con "Provider Details" → Name, Credential, NPI, MPI

**Pedido:** Falta incluir MPI y NPI del proveedor en el Service Log.
El PDF del service log tiene una sección "Provider Details" con campos Name, Credential,
NPI y MPI. Actualmente estos campos no se están llenando desde nuestro sistema.

**Nota:** Los campos NPI y MPI ya existen en nuestro modelo de proveedor (se ven en la
session note: `NPI: 1083488704`, `MPI: 120581600`). Solo hay que pasarlos al generador
del Service Log.

**Componentes afectados:**
- Service Log generation (ver `plans/service-log.md`)
- Template PDF del service log

---

### L3. Nombre del behavior con lápiz/acceso a definición

**Pantalla:** Datasheet de data collection del cliente
**Screenshot:** Toolbar del datasheet con "Frequency/Count" y la cabecera Week/Month

**Pedido:** En la pantalla del datasheet, colocar el nombre del behavior con un ícono de
lápiz o enlace que dé acceso a la definición del behavior (la descripción, tipo, baselines,
objectives, etc.). Hacer lo mismo tanto para behaviors (maladaptive) como para replacements.

**Screenshot referencia:** La pantalla de configuración del item (`image7.png`) muestra
todo el detalle del item: Type, Weekly/Daily Value, Hypothesized Function, Teaching
Procedure, Environmental Changes, Description, Baselines, Objectives.

**Idea:** Un clic en el nombre del behavior (o en el lápiz) abre el drawer de configuración
de data collection en modo lectura, o navega a la página del item en el service plan.

**Componentes afectados:**
- Datasheets (FrequencyDatasheet, RateDatasheet, etc.) — agregar nombre clickeable/lápiz
- Posible reutilización de `ClientDataCollectionDrawer` en modo read-only

---

## PEDIDOS DE MIRIAM

### M1. "Other Services" obligatorio en Assessment (sin toggle PDF)

**Pantalla:** Assessment form → sección "Other Services"
**Screenshot:** Sección con Previous ABA therapy, Previous agency name, Speech/OT/PT/Feeding,
Other, Facility name — con toggle "Include in PDF"

**Pedido:** La sección "Other Services" tiene que estar en el assessment por obligación.
Quitar la opción "Include in PDF" para esta sección específica. Por default tiene que estar
incluida siempre.

**Componentes afectados:**
- `PdfSectionsVisibility.tsx` o `SectionPdfToggle.tsx` — remover toggle para Other Services
- `AssessmentForm.tsx` — marcar la sección como siempre incluida

---

### M2. Campo "Agency" en Other Services del Assessment

**Pantalla:** Assessment form → sección "Other Services"

**Pedido:** Tiene que haber un espacio para escribir la agencia (donde el cliente recibió
ABA antes). Ponerlo en el mismo formato que ya tiene lo de "Previous ABA therapy" (input
de texto libre).

**Nota:** Ya existe "Previous agency name" en el screenshot. Verificar si ya está implementado
o si falta un campo adicional de "Agency" separado.

**Componentes afectados:**
- Assessment form Other Services section

---

### M3. Estimado de masterización para maladaptive behaviors y programas

**Pantalla:** Objectives/STOs dentro del service plan del cliente
**Screenshots:**
- STO edit modal con Name, Short name, Status, Start date, Estimated End Date, End date
- Objectives tab mostrando lista de STOs con columnas Name, Start date, Est. End Date, End date, Status

**Pedido:** Ahora están pidiendo el estimado de masterización para los maladaptive behaviors
y programas. El campo "Estimated End Date" ya existe en el modal de edición del STO.

**Aclaración necesaria:** ¿Se refiere a que el campo ya existe pero no se está mostrando/
usando correctamente? ¿O necesitan un cálculo automático del estimado de masterización
basado en la tendencia de los datos? Confirmar con Miriam.

---

### M4. Settings de categoría como lista desplegable multi-select

**Pantalla:** Assessment → CategoryItemsSection (configuración por item)
**Screenshot:** Lista de behaviors (Non-Compliance, Physical Aggression, Screaming, Tantrums)
cada uno con: Intensity (dropdown), Intensity description, Hypothesized function (dropdown),
Prevalent setting, Preventive strategies (antecedent), Management strategies (consequence)

**Pedido:** Los campos tipo dropdown (Intensity, Hypothesized function) deben ser **lista
desplegable donde se pueda escoger más de una opción** (multi-select). Donde quiera que
haya "settings" (configuración de item) tiene que estar con ese formato de multi-select.

**Componentes afectados:**
- `CategoryItemsSection.tsx` en Assessment — cambiar dropdowns a MultiSelect
- Verificar si Intensity y Hypothesized Function ya son multi-select en el service plan
  (en SP, Hypothesized Function ya es multi-select: "Escape × Attention × Tangible ×")

---

### M5. BCBA arriba en la sección Providers del Assessment

**Pantalla:** Assessment form → sección "Providers"
**Screenshot:** Lista de proveedores con Type, Name, Contact information. Tiene:
Psychiatry/HappySpeech, BCBA/Lidia Rodriguez, BCBA/Miriam Moreno

**Pedido:**
1. El nombre del BCBA tiene que estar **arriba** (primera posición), porque el BCBA es
   el/la creador(a) del assessment y su nombre tiene que estar en primera plana.
2. En la sección de Providers solo poner los **proveedores externos** (Psychiatry, Speech, etc.).
3. La info del BCBA creador debe ir en una sección separada, después de la información del
   cliente — al estilo del ejemplo de Maximum Achievers donde aparece:
   - Provider Information: Servicing Provider, Phone, Evaluators (nombre + credencial)

**Screenshot referencia:** PDF de Maximum Achievers con secciones Client's Information →
Provider Information → Treatment Package → Current Treatment Progress

**Componentes afectados:**
- `AssessmentForm.tsx` — nueva sección "Provider Information" (BCBA creador) separada de
  "Other Providers" (externos)
- Posiblemente prefill del BCBA desde el usuario logueado o el proveedor asignado al cliente

---

### M6. Mover sidebar de categorías (quita mucho espacio)

**Pantalla:** Configuración del cliente → Service Plan → CategoriesSidebar
**Screenshots:** Vista de configuración con sidebar izquierdo mostrando "Service Plan" y
"Data Collection" + panel central con "CATEGORIES" (Maladaptive Behaviors, Replacement
Behaviors)

**Pedido:** La sidebar de "Configuration" (Service Plan / Data Collection) se puede mover
"para donde está la flecha" — quita mucho espacio en la pantalla.

**Interpretación:** Probablemente quiere que la sidebar sea colapsable o que las secciones
Service Plan / Data Collection sean tabs en vez de sidebar, para dar más espacio al contenido
principal (categorías + items + datasheets).

**Componentes afectados:**
- `ClientConfigurationLayout.tsx` — hacer sidebar colapsable o cambiar a tabs

---

### M7. Línea discontinua después del Baseline en la gráfica

**Pantalla:** Datasheet chart (FrequencyChart)
**Screenshot:** Chart con Baseline (rojo), Treatment (azul), Objective: 45 (punteado verde).
Datos del 08/24 al 09/19.

**Pedido:** Tiene que haber una **línea discontinua (dashed line) después del BL (baseline)**.
Es decir, la separación visual entre la fase de baseline y la fase de treatment debe ser
una línea vertical discontinua.

**Nota:** Actualmente el chart ya tiene la lógica de phase line (baseline vs treatment), pero
la línea divisoria podría no ser discontinua o no estar visible. El `treatmentStart` se
calcula desde el primer STO `startDate`.

**Componentes afectados:**
- `FrequencyChart.tsx` (y variantes Duration, Rate, Percentage) — asegurar que la phase line
  entre baseline y treatment sea dashed/discontinua

---

### M8. Cambiar labels "azulitos" — usar el término del analista

**Pantalla:** Environmental Changes on the Chart (configuración del item)
**Screenshot:** Sección "ENVIRONMENTAL CHANGES ON THE CHART" con dropdown "Label on the chart"
y toggle "Also list them under the chart, with their dates". Texto helper: "Each change gets
a tag on the chart — EC1, EC2… — and the list underneath says what each one was."

**Pedido:** Lo que está en "azulito" (el texto helper/explicativo de la sección) hay que
cambiarlo. Quedaron en que se va a enseñar el término que usó el analista, no los tags
genéricos EC1, EC2.

**Interpretación:** En vez de mostrar "EC1, EC2..." como etiquetas en el chart, mostrar el
texto real del environmental change que escribió el analista (e.g., "medication change",
"new school year"). El helper text debe reflejar esto.

**Componentes afectados:**
- `environmental-changes-display.tsx` — renderizar el texto del analista, no "EC1, EC2"
- Helper text en la configuración (DataCollectionForm)
- FrequencyChart y variantes — las annotations del chart deben mostrar el texto real

---

### M9. Multi-select para Teaching Method en Session Notes

**Pantalla:** Session Note (97153, 97155, 97156)
**Screenshot:** Session Note 97153 con Teaching Method dropdown mostrando: BST, DTT (selected),
Incidental teaching, NET, PRT

**Pedido:** En la nota hay que poder escoger **más de un teaching method**.
Aplica a las tres notas: 97153, 97155 (HN), 97156 (HN).

**Componentes afectados:**
- `SessionNoteForm.tsx` (97153) — Teaching Method de single-select a MultiSelect
- `SessionNote97155Form.tsx` — igual (si aplica, verificar si 97155 tiene Teaching Method)
- `SessionNote97156Form.tsx` — igual
- Types/schemas — `teachingMethodId: string` → `teachingMethodIds: string[]`
- Backend — verificar si acepta array o requiere cambio

---

## RESUMEN DE PRIORIDADES

| # | Pedido | Módulo | Complejidad | Backend |
|---|--------|--------|-------------|---------|
| L1 | Custom date range en charts | Charts | Media | No |
| L2 | MPI/NPI en service log | Service Log | Baja | Listo (V32) |
| L3 | Nombre behavior con lápiz en datasheet | Data Collection | Baja | No |
| M1 | Other Services obligatorio (sin toggle PDF) | Assessment | Baja | No |
| M2 | Campo Agency en Other Services | Assessment | — | Ya existe |
| M3 | Estimado masterización | Service Plan | Aclarar | Aclarar |
| M4 | Multi-select en settings assessment | Assessment | Media | Posible |
| M5 | BCBA arriba + proveedores separados | Assessment | Media | No |
| M6 | Sidebar colapsable/mover | Configuration | Media | No |
| M7 | Línea discontinua post-BL | Charts | Baja | No |
| M8 | Labels EC → texto del analista | Charts/DC Config | Media | No |
| M9 | Multi-select Teaching Method en notas | Session Notes | Media | Sí |
