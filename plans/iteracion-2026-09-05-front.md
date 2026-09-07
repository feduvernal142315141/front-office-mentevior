# Iteración 2026-09-05 — bloque de front

> Índice de la iteración: [`plans/iteracion-2026-09-05.md`](./iteracion-2026-09-05.md)
> Alcance: **sólo lo que se puede construir hoy, sin contrato nuevo de backend y sin romper
> nada de lo que ya funciona.** Todo lo que toca un endpoint va en
> [`docs/pedidos-backend-2026-09-05.md`](../docs/pedidos-backend-2026-09-05.md).

## ✅ Estado — implementado 2026-09-05

Las cuatro fases están construidas. `tsc` y `next build` pasan. Lo que se desvió del plan
original está anotado en cada fase con el prefijo **Implementado**.

| Fase | Estado | Desvío |
|---|---|---|
| 1 · Textos y guías | ✅ | El texto de Goals fue en **español**, tal como se dictó (D6 sigue abierta: es un string) |
| 2 · Assessment secciones obligatorias | ✅ | D4 se resolvió con la **opción A** (ver abajo) |
| 3 · Guard de cambios sin guardar | ✅ infraestructura + 4 pantallas | Los modales del wizard del cliente quedan pendientes de D5 |
| 4 · Pantalla de todas las gráficas | ✅ | Rate, Percentage y Time-sampling no se pueden dibujar de sólo lectura (ver Fase 4) |

**D4 se resolvió con la opción A**: las seis secciones se imprimen siempre, pero **no** se
volvieron obligatorias para guardar. La decisión vive en una sola función,
`sectionBlocksSave()` en `useAssessmentForm.ts`, así que endurecerla después es cambiar un
`return`. Nada que se guardaba ayer dejó de guardarse.

## Regla de esta iteración

Ninguna fase cambia el payload que viaja al backend, salvo los flags de PDF de la Fase 2 —
que ya existen en el contrato y sólo pasan a mandarse siempre en `true`. Cada fase es un
commit independiente y reversible.

---

## Fase 1 — Textos y guías

Riesgo: nulo. Son strings y una mejora de layout del textarea. Cierra **F4** y **F6**.

### 1.1 · La guía del ABC se corta (F4)

**Diagnóstico.** `FloatingTextarea` pinta la guía como un overlay absoluto sobre el propio
campo (`components/custom/FloatingTextarea.tsx:92-108`):

```
absolute inset-0 overflow-hidden rounded-[16px] px-4 pt-11 pb-3
+ un degradado de corte en el borde inferior
```

El alto lo fija el textarea con `minHeight: max(100, rows * 24 + 24)`. El ABC de
`AiImprovableTextarea` va con `rows={4}` → 120px de caja, de los cuales 44px son el padding
superior del overlay. `AI_ABC_GUIDANCE` (intro + 3 viñetas + ejemplo) mide ≈ 240px, así que
se ve la intro y media viñeta. Lo mismo le pasa a los 12 campos de Background del Assessment
(`rows={4}` con `ASSESSMENT_BACKGROUND_GUIDANCE`).

**Opciones evaluadas.**

| # | Enfoque | Costo | Contra |
|---|---|---|---|
| A | Subir `rows` del ABC a 8–10 | trivial | La caja queda enorme siempre, incluso ya escrita; y no arregla Background |
| B | **El campo crece sólo mientras la guía está visible** y vuelve a su alto normal al enfocar | bajo | Hay que medir el overlay |
| C | Sacar la guía a un bloque colapsable arriba del campo | medio | Rompe el patrón del repo (guía *dentro* del campo) y suma un click |

**Elegida: B.** Conserva el patrón que ya usa toda la app y arregla de una vez todos los
campos con guía.

**Implementación** (`components/custom/FloatingTextarea.tsx`):

1. `ref` sobre el `div` del overlay de guía + `useLayoutEffect` que guarda su `scrollHeight`
   en estado cuando `guidance` cambia.
2. `minHeight` del textarea pasa a `Math.max(altoPorRows, altoGuia)` **sólo mientras
   `showGuidance` es `true`**; al enfocar o al haber texto vuelve a `altoPorRows`.
3. La transición se hace con `transition-[min-height] duration-200 ease-out` para que no
   pegue un salto.
4. El degradado de corte pasa a renderizarse sólo si la guía sigue sin entrar (defensa por si
   la medición falla en SSR o con fuentes que todavía no cargaron).

**Cuidado:** `resize-y` está activo en el textarea. Si el usuario ya lo redimensionó a mano,
el `min-height` no debe pisar su `height`. Como el redimensionado del navegador escribe
`style.height` inline y `min-height` sólo actúa como piso, no hay conflicto — pero hay que
verificarlo a mano en Chrome y Safari.

**Alcance colateral (a favor):** arregla el corte en 97153/97156 Session Summary, en los 4
narratives de 97155, en los 12 campos de Background y en el `backgroundSummary`.

### 1.2 · Texto de Goals en 97156 (F6)

El campo existe y hoy **no tiene guía**
(`app/(app)/session-note/components/SessionNote97156Form.tsx:405`).

1. Agregar un `FieldGuidance` nuevo en `lib/constants/session-note-guidance.ts` junto a
   `SESSION_SUMMARY_97156`, registrado en `SESSION_NOTE_GUIDANCE["97156"].goals`.
2. Pasarlo como `guidance={SESSION_NOTE_GUIDANCE["97156"].goals}` en el `FloatingTextarea`.

Texto dictado (pendiente de decidir el idioma → [D6](./iteracion-2026-09-05-definiciones.md#d6--idioma-de-los-textos-de-guía-f4-f5-f6)):

> Describa brevemente qué habilidad, estrategia o componente del tratamiento se trabajó con
> el cuidador; qué se enseñó, explicó, modeló, practicó o revisó; cómo participó o respondió
> el cuidador; qué retroalimentación se proporcionó; y cualquier recomendación o próximo
> paso. Puede escribir de manera informal, utilizando frases cortas o viñetas.

**Ojo con el archivo:** su cabecera dice que los textos son transcripción literal de los
templates CASP. Estos dos son textos propios de la clínica, no del CASP — hay que dejarlo
anotado en el comentario para que nadie los "corrija" contra el PDF.

El equivalente de 97155 (**F5**) queda fuera de esta fase: ese formulario no tiene campo
Goals → [D2](./iteracion-2026-09-05-definiciones.md#d2--el-cuadro-de-goals-de-97155-no-existe-f5).

**Implementado.** `FloatingTextarea` mide el overlay con `ResizeObserver` y estira el
`min-height` del textarea mientras la guía está visible **o el campo tiene foco**. Ese "o el
campo tiene foco" no estaba en el plan y es lo que evita que la caja se encoja bajo el cursor
al hacer click: el único cambio de alto ocurre al salir del campo, nunca mientras se escribe.
El degradado de corte quedó como red de seguridad, condicionado a que la guía no entre.

### Criterios de aceptación — Fase 1

- [ ] Con el ABC vacío se leen la intro, las 3 viñetas y el ejemplo completos, sin degradado.
- [ ] Al hacer click el campo vuelve a su alto de 4 filas y la guía desaparece.
- [ ] Si el campo queda vacío al salir, la guía vuelve y el campo se expande otra vez.
- [ ] El campo de Goals de 97156 muestra el texto nuevo mientras está vacío y sin foco.
- [ ] Ningún otro campo con guía perdió comportamiento (revisar 97153, 97155 ×4, Background).

---

## Fase 2 — Assessment: secciones obligatorias

Cierra **F9.1**, **F9.2a**, **F9.4**, **F9.5**. Las partes de F9.2b, F9.3 y F9.6 que
necesitan campos nuevos viven en el doc de backend.

> ⚠️ **Bloqueante parcial:** antes de forzar los flags hay que resolver
> [D4](./iteracion-2026-09-05-definiciones.md#d4--obligatorio-en-el-pdf--obligatorio-para-guardar-f9).
> Ver "El riesgo real" más abajo: hoy el flag de PDF y la obligatoriedad de los campos son
> la misma cosa.

### 2.1 · Qué secciones dejan de ser opcionales

| Sección | Flag | Archivo |
|---|---|---|
| Background (con Housing & Family adentro) | `showBackgroundInformation` + `showHousingFamily` | `AssessmentForm.tsx:354` y `:466` |
| Medical History | `showMedicalHistory` | `AssessmentForm.tsx:402` |
| Current Medications | `showCurrentMedications` | `AssessmentForm.tsx:501` |
| Categories & Items | `showAssessmentCategories` | `AssessmentForm.tsx:577` |
| Billing Codes | `showRecommendedServices` | `AssessmentForm.tsx:601` |
| Providers | `showProvidersOnFile` | `AssessmentForm.tsx:668` |

Cambios:

1. Quitar `headerAction={<SectionPdfToggle …/>}` y `contentHidden={…}` de esas seis
   secciones. El componente `Section` ya soporta que no le pasen ninguna de las dos
   (`AssessmentForm.tsx:820`), así que no hay que tocarlo.
2. `buildDefaultPdfFlags()` (`useAssessmentForm.ts:128`) pasa a devolver `true` para los
   seis flags obligatorios y `false` para el resto, como hoy.
3. La precarga al editar (`useAssessmentForm.ts:380`) hace
   `assessment[key] ?? false`; para los seis obligatorios hay que forzar `true`, así un
   assessment viejo guardado con el flag apagado se normaliza al abrirlo.
4. Definir la lista en un solo lugar —
   `ASSESSMENT_PDF_MANDATORY_FLAGS` en `lib/constants/assessment.constants.ts`— y consumirla
   desde los tres puntos anteriores, para que no queden tres listas que se desincronizan.

### 2.2 · Housing & Family adentro de Background (F9.1)

Hoy son dos `Section` hermanas con dos flags. Pasa a ser **una** sección "Background" con dos
sub-bloques titulados:

```
Section "Background"
├── sub-bloque "Housing & family"
│     Housing type · Rooms · Bathrooms · Household members · Housing / family information
└── sub-bloque "Current functioning, strengths and skills"
      Summary + los 12 campos de ASSESSMENT_BACKGROUND_FIELDS
```

- El sub-título se resuelve con un encabezado liviano dentro del cuerpo de la sección
  (`text-xs font-semibold uppercase tracking-wider text-slate-400`), el mismo tratamiento que
  usa `CategoryItemsSection` para agrupar por categoría — no hace falta un componente nuevo.
- `showHousingFamily` deja de tener switch propio pero **sigue existiendo en el payload**:
  se manda siempre `true`. No se toca el contrato.
- Los `data-field` de los campos de housing no cambian, así que el scroll-al-error sigue
  funcionando igual.

### 2.3 · Quitar el aviso del diagnóstico (F9.2a)

`AssessmentForm.tsx:403-419` pinta una caja informativa que en create dice *"The client's
current primary diagnosis is captured automatically when the assessment is created"*. Se
elimina la rama de create.

La rama de edit (que muestra el snapshot `medicalHistoryPrimaryDiagnosisName`) se **conserva
tal cual** hasta que backend entregue [B4](../docs/pedidos-backend-2026-09-05.md#b4--diagnóstico-del-assessment-visible-y-editable);
ahí se reemplaza por el campo editable.

### El riesgo real de esta fase

En `useAssessmentForm.ts:596-670` **el flag de PDF es también la condición de
obligatoriedad**. Forzar los seis flags a `true` convierte en requeridos:

| Flag forzado | Qué pasa a ser obligatorio para guardar |
|---|---|
| `showHousingFamily` | Housing type + Housing/family information |
| `showMedicalHistory` | Other diagnosis, Morbidities, Allergies, Type of birth |
| `showBackgroundInformation` | Summary + los **12** campos de background |
| `showCurrentMedications` | al menos una fila de medicación ← choca de frente con F9.3 |
| `showAssessmentCategories` | al menos un item evaluado |
| `showRecommendedServices` | al menos un billing code |
| `showProvidersOnFile` | al menos un provider |

Además los mensajes dicen *"…, or turn the section off"*, salida que deja de existir.

**Propuesta (a confirmar en D4):** desacoplar las dos cosas.

- Los seis flags salen del `if (flags.X)` de la validación y pasan a una constante aparte
  `ASSESSMENT_REQUIRED_TO_SAVE`, que arranca con lo que hoy ya era obligatorio.
- Los mensajes pierden el *"or turn the section off"*.
- Así "siempre sale en el PDF" y "no podés guardar sin esto" quedan separados y se pueden
  ajustar sin volver a tocar el layout.

**Implementado.**

- `ASSESSMENT_PDF_MANDATORY_FLAGS` en `lib/constants/assessment.constants.ts` es la única
  lista; la consumen los defaults, la precarga al editar y la validación.
- `sectionBlocksSave(flags, key)` en `useAssessmentForm.ts` reemplazó los `if (flags.showX)`
  de la validación. Para las seis obligatorias devuelve `false`; para el resto, el flag. El
  código de validación quedó intacto: revertir la decisión es cambiar esa función.
- Background absorbió Housing & Family con un componente `SubHeading` nuevo, y quedó ubicado
  donde estaba Housing (después de School Information), así el orden narrativo es
  escuela → casa/familia → funcionamiento → historia médica → medicaciones.
- El aviso del diagnóstico ahora sólo se pinta al editar, donde el snapshot existe.

### Criterios de aceptación — Fase 2

- [ ] Las seis secciones no muestran switch de PDF y su contenido nunca se pliega.
- [ ] Un assessment creado hoy manda los seis flags en `true`.
- [ ] Un assessment viejo con `showMedicalHistory: false` se abre con la sección visible y al
      guardar queda en `true`.
- [ ] Housing & Family se ve como sub-bloque de Background y sus campos siguen guardándose.
- [ ] En create ya no aparece la caja azul del diagnóstico.
- [ ] Se puede guardar un assessment sin romper nada que hoy se guardaba (según lo que se
      decida en D4).

---

## Fase 3 — Guard de cambios sin guardar (L1)

Cierra **L1**. Es la fase transversal: conviene hacerla antes de sumar más formularios.

### 3.1 · Qué hay hoy

El patrón existe y funciona, pero **sólo en Client Configuration**:

- `ItemDetailPanel.tsx:466-489` — `guardedNavigate()` con `alert.confirm`.
- `ServicePlanConfigView.tsx:82` y `ClientConfigurationLayout.tsx:51` — el mismo diálogo.
- Los datasheets usan `SaveBar` con Save / Discard explícitos.

**No** lo tienen: `ClientDataCollectionModal`, `ClientDataCollectionDrawer`,
`ObjectiveFormModal`, `GenerateObjectivesModal`, `DiagnosisFormModal`, `AppointmentModal`,
`EditClientServicePlanModal`, `RateModal`, ni ninguno de los modales de los steps del wizard
del cliente (`Step2Addresses`, `Step3Caregivers`, `Step4Medications`, `Step5Physicians`,
`Step9Providers`, `StepInsurances`). En todos ellos, cerrar con la X, con Escape o clickeando
afuera tira lo cargado sin preguntar.

### 3.2 · Bug del diálogo actual

El diálogo de hoy tiene **dos** botones y el de cancelar en realidad descarta:

```ts
confirmText: "Save",
cancelText: "Cancel",
onConfirm: () => formRef.current?.requestSubmit(),
onCancel:  () => action(),          // ← "Cancel" descarta y navega
```

Justo lo que pide Lidia — *"poner aviso si va a desechar o guardar"* — necesita **tres**
salidas, y hoy el botón que promete no hacer nada es el que borra el trabajo.

### 3.3 · Plan

**Paso 1 — Tercer botón en el alert (retro-compatible).**

- `lib/types/alert.types.ts`: `AlertConfig` y `ConfirmOptions` suman `discardText?: string` y
  `onDiscard?: () => void`.
- `components/custom/AlertModal.tsx`: si viene `onDiscard`, pinta tres botones —
  **Cancel** (ghost, cierra sin hacer nada), **Discard** (rojo suave), **Save** (primario).
  Sin `onDiscard` se comporta exactamente como hoy, así que ningún `confirm` existente cambia.
- El cierre por X / overlay / Escape mapea a **Cancel**, nunca a Discard.

**Paso 2 — Hook reusable `lib/hooks/use-unsaved-changes-guard.ts`.**

```ts
useUnsavedChangesGuard({ isDirty, onSave })
  → guard(action)        // envuelve cualquier navegación o cierre
  → requestClose(close)   // atajo para el onOpenChange de un modal
```

Encapsula el `alert.confirm` de tres botones con los textos ya definidos, para que las ~15
pantallas no repitan el copy ni se olviden del tercer botón.

**Paso 3 — Adopción, por orden de dolor.**

1. `ClientDataCollectionModal` y `ClientDataCollectionDrawer` — son los "boxes" con más
   carga (data collection + chart + baselines + objectives).
2. `ObjectiveFormModal` y `GenerateObjectivesModal`.
3. `DiagnosisFormModal` y `AppointmentModal`.
4. Los modales de los steps del wizard del cliente.
5. `EditClientServicePlanModal`, `RateModal`.

**Paso 4 — Corregir el guard existente** de `ItemDetailPanel` / `ServicePlanConfigView` /
`ClientConfigurationLayout` para que use el hook y deje de descartar desde "Cancel".

### 3.4 · Cómo detectar el `isDirty` en cada modal

No hay un criterio único hoy. Dos caminos según el modal:

- **react-hook-form** (`ItemDetailPanel`, forms del wizard): `formState.isDirty`, más los
  snapshots por `ref` para el estado que vive fuera del form — el patrón ya escrito en
  `ItemDetailPanel.tsx:362-460`.
- **useState suelto** (la mayoría de los modales): snapshot del estado inicial al abrir y
  comparación por `JSON.stringify`, igual que `snapshotRows()`. Conviene extraer ese helper a
  `lib/utils/` para no copiarlo en cada modal.

**Implementado.**

- `lib/types/alert.types.ts` + `AlertModal` + `alert-context`: tercer botón opcional. Sin
  `onDiscard` el diálogo se comporta igual que siempre, así que los `confirm` que ya existían
  en la app no cambiaron.
- `lib/hooks/use-unsaved-changes-guard.ts` — el diálogo de tres salidas.
- `lib/hooks/use-dirty-baseline.ts` — **no estaba en el plan**. Es el patrón de las dos
  esperas de frame que `ItemDetailPanel` tenía escrito a mano, extraído para que las
  pantallas que suman el guard no nazcan "sucias" y disparen el aviso sin que nadie tocara
  nada.
- Adoptado en: `ItemDetailPanel`, `ServicePlanConfigView`, `ClientConfigurationLayout`
  (los tres pasaron de ref a estado y perdieron el bug del "Cancel" que descartaba),
  `ClientDataCollectionModal`, `ClientDataCollectionDrawer` (vía `ClientDataCollectionForm`,
  que ahora reporta su estado con `onDirtyChange` y acepta `formRef`), `ObjectiveFormModal` y
  `GenerateObjectivesModal`.
- **Pendiente:** los modales de los steps del wizard del cliente, a la espera de
  [D5](./iteracion-2026-09-05-definiciones.md#d5--qué-boxes-perdieron-información-l1).

### Criterios de aceptación — Fase 3

- [ ] Con cambios sin guardar, cerrar por X, Escape o click afuera abre el diálogo.
- [ ] El diálogo ofrece **Save**, **Discard** y **Cancel**, y Cancel deja todo como estaba.
- [ ] Sin cambios, el modal cierra directo, sin diálogo.
- [ ] Guardar desde el diálogo guarda **y** cierra.
- [ ] Los `alert.confirm` que ya existían en la app siguen mostrando dos botones.

---

## Fase 4 — Pantalla de todas las gráficas (L3)

Cierra **L3**. Se puede hacer sólo con front, pero rinde mucho mejor con
[B7](../docs/pedidos-backend-2026-09-05.md#b7--endpoint-agregado-de-gráficas-por-cliente).

### 4.1 · Qué hay hoy

Las gráficas se ven **de a una**, dentro del datasheet del item activo
(`DataCollectionContent.tsx:460-468`). Hay cinco renderers —`FrequencyChart`, `RateChart`,
`PercentageChart`, `DurationChart` y el interval dentro de `IntervalDatasheet`— y todos
reciben el estado del datasheet (`weekDays`, `entries`, `dcConfig`, …), es decir están atados
a la pantalla de captura.

El único consumo de sólo-lectura que existe es `SessionItemChartPanel`
(`app/(app)/session-note/components/SessionItemChartPanel.tsx`), que arma la serie con
`useChartData` y la dibuja en modo `compact`. **Pero sólo sabe dibujar `FrequencyChart`**
(línea 17): si el item es Rate, Percentage o Duration, hoy no tiene renderer.

### 4.2 · Plan

**Paso 1 — Extraer `ReadOnlyItemChart`.**
Sacar de `SessionItemChartPanel` la parte de "resolver datos + dibujar" a un componente
propio en `app/(app)/clients/[id]/configuration/components/datasheets/ReadOnlyItemChart.tsx`,
y hacerlo **type-aware**: resuelve el tipo del item con los helpers que ya existen
(`typeRequiresWeeklyDaily`, `typeRequiresUnitOfTime`, `typeIsMeasurementLog`,
`typeRequiresDailyAndWeekly`, `typeRequiresInterval` de
`lib/modules/service-plans/constants/data-collection.constants.ts`) y elige el chart.

Este paso, por sí solo, arregla de paso el panel de la session note para items que no son
Frequency.

**Paso 2 — Pantalla.**
Ruta nueva `app/(app)/clients/[id]/charts/page.tsx`, con el mismo gating que el resto del
cliente. Layout:

```
[ Toolbar: rango de fechas · intervalo · (opcional) filtro por categoría ]

Maladaptive Behaviors            (n)
┌───────────┬───────────┬───────────┐
│  item 1   │  item 2   │  item 3   │   ← grid 1 / 2 / 3 columnas
└───────────┴───────────┴───────────┘

Replacement Behaviors            (n)
…

Caregiver Training               (n)
…
```

- Un solo `ChartDateRangeToolbar` arriba que gobierna todas las gráficas — si cada tarjeta
  trae la suya, la pantalla se vuelve ruido.
- Cada tarjeta: nombre del item, el chart en `compact`, y el `ActiveObjectiveBanner` si el
  item tiene STO activo.
- Click en una tarjeta → `/clients/[id]/configuration` con el item activo (ya hay deep-link
  por item en esa pantalla).

**Paso 3 — Datos.**
Con lo que existe hoy hay que encadenar, por cliente:
`getClientServicePlanByClientId` → `getClientServicePlanCategories` →
`getClientServicePlanCategoryItems` por categoría → `getClientItemDataCollection` **por
item**. Para un cliente con 15 items son ~18 requests.

Mitigación mientras no exista B7: cargar las tarjetas **por categoría y bajo demanda**
(la categoría trae sus items al desplegarse), con esqueletos mientras llegan, y `Promise.all`
acotado a la categoría visible. Si backend entrega B7, el paso 3 se reemplaza por una sola
llamada y el resto de la pantalla no cambia.

**Implementado.**

```
app/(app)/clients/[id]/charts/page.tsx                      → la pantalla
app/(app)/clients/[id]/charts/components/ClientChartsView.tsx    → carga y agrupa
app/(app)/clients/[id]/charts/components/ReadOnlyItemChart.tsx   → una tarjeta por item
```

- **Los datos salen más baratos de lo previsto.** No hace falta el `GET …/level` por item:
  `getClientServicePlanCategoryItems(categoryId)` ya devuelve `baseline`, `objetive`,
  `dataCollection` y `chart` de cada item. Son **1 + N_categorías** requests, no 1 + N_items.
- Entrada desde el header de Client Configuration: botón **View all charts**, que pasa por el
  guard de cambios sin guardar antes de navegar.
- El permiso ya está cubierto: `/clients/[id]/charts` resuelve por prefijo al módulo
  `clients`, igual que el resto de las pantallas del cliente.

**Desvío importante — no todos los tipos se pueden dibujar de sólo lectura.**

| Tipo | Estado |
|---|---|
| Frequency, Frequency/Count | ✅ `FrequencyChart` |
| Duration, Latency, Interresponse time | ✅ `DurationChart` |
| **Rate** | ❌ necesita la duración de la sesión, que sale de los appointments |
| **Percentage of Opportunities** | ❌ necesita los ensayos uno por uno; el endpoint de valores devuelve un número por fecha |
| **Time-sampling / Measurement Log** | ❌ sin renderer de sólo lectura |

Antes que dibujar una gráfica con datos que no son los suyos, esas tarjetas muestran un
estado explícito que manda a Data Collection. Se resuelve con
[B7](../docs/pedidos-backend-2026-09-05.md#b7--endpoint-agregado-de-gráficas-por-cliente),
que además elimina el doble fetch de valores que hoy hacen `ReadOnlyItemChart` y `useChartData`
(el mismo que ya hace el panel de la session note).

**Extra que quedó gratis:** `resolveChartKind()` es la primera pieza type-aware de lectura;
`SessionItemChartPanel`, que hoy dibuja `FrequencyChart` para cualquier tipo, puede pasar a
usarla cuando se quiera.

### Criterios de aceptación — Fase 4

- [ ] Se ven las gráficas de las tres categorías en una sola pantalla, agrupadas y rotuladas.
- [ ] Los items que no son Frequency dibujan su gráfica correcta.
- [ ] Cambiar el rango arriba afecta a todas las gráficas.
- [ ] Un cliente sin service plan activo ve un empty state, no un error.
- [ ] La pantalla no dispara más de una tanda de requests por categoría desplegada.

---

## Lo que NO entra en el bloque de front

Para que quede explícito, y no se intente "resolver a medias":

| Pedido | Por qué no |
|---|---|
| **L2** environmental changes con 3 modos | `ChartConfig` no tiene dónde guardar el modo ni el label corto; sin persistencia la elección del proveedor se pierde al recargar |
| **F2** varios teaching procedures | `teachingProcedureId` es un UUID único en el contrato |
| **F8** other providers en el cliente | No existe asociación cliente ↔ provider-on-file |
| **F9.2b** diagnóstico editable | Hoy es un snapshot de sólo lectura del backend |
| **F9.3** checkmark de "denied medications" | No hay dónde persistirlo |
| **F9.6** providers halados del service plan | El backend no los expone |
| **F10** other services | Son campos nuevos |
| **F11** halar todo el service plan | `assessment-data` sólo devuelve `id`, `name` y `hypothesizedFunction` |
| **L4**, **L5** service log | Snapshot generado por backend; el front ya está |

Recordatorio permanente: **el PDF del assessment lo arma el backend**. El front sólo hace de
proxy (`app/api/reports/assessment/preview`). Cualquier "que salga en el PDF" es pedido de
backend aunque el campo lo capturemos nosotros.
