# Iteración 2026-09-05 — pendientes de definición

> Índice de la iteración: [`plans/iteracion-2026-09-05.md`](./iteracion-2026-09-05.md)
>
> Acá está lo que **no se puede arrancar hasta que alguien decida**. No son dudas técnicas:
> en todos los casos el front sabe cómo hacerlo, pero hay dos o más lecturas del pedido que
> llevan a resultados distintos. Cada punto trae qué se pidió, qué hay hoy, las opciones con
> su costo, y una recomendación.
>
> **Cómo responder:** alcanza con marcar la opción por id (ej. "D1 → opción B").

## Tablero

| Id | Qué falta decidir | Bloquea | Urgencia |
|---|---|---|---|
| [D1](#d1--dónde-va-el-botón-de-generate-with-ai-f3) | Dónde va el botón "Generate with AI" | F3 | Alta — puede que ya esté resuelto |
| [D2](#d2--el-cuadro-de-goals-de-97155-no-existe-f5) | El cuadro de Goals de 97155 no existe | F5 | Alta |
| [D3](#d3--descripción-de-la-intensidad-f12) | Qué es "la descripción de la intensidad" | F12, y parte de B9 | Media |
| [D4](#d4--obligatorio-en-el-pdf--obligatorio-para-guardar-f9) | ¿Obligatorio en el PDF = obligatorio para guardar? | Front Fase 2 | ✅ Resuelto: opción A |
| [D5](#d5--qué-boxes-perdieron-información-l1) | En qué pantallas se perdió lo cargado | Prioriza Front Fase 3 | Media |
| [D6](#d6--idioma-de-los-textos-de-guía-f4-f5-f6) | Idioma de los textos de guía | F5, F6 | ⚠️ Se implementó en español; confirmar |
| [D7](#d7--los-cuatro-cuadros-abc-de-97155-f4) | Los cuatro cuadros ABC de 97155 | F4 | Media |

---

## D1 · Dónde va el botón de "Generate with AI" (F3)

**Se pidió:** *"El botón de 'Generate with AI' que esté en el cuadrante de summary."*

**Qué hay hoy.** El 2026-09-04 (commit `682cdd5`) el botón se sacó de adentro del campo ABC
—donde tapaba la guía y el texto escrito— y pasó a una fila propia **arriba del ABC**,
alineada a la derecha. El Undo del Summary recibió el mismo tratamiento.

**La duda.** El pedido puede ser anterior a ese cambio y estar ya resuelto, o puede querer
decir algo distinto: que la fila de acciones cuelgue del **Summary** en vez del ABC.

### Opciones

| | Opción | Qué implica |
|---|---|---|
| **A** | **Ya está resuelto** — el pedido apuntaba a que el botón dejara de tapar el texto | Cero trabajo |
| **B** | La fila de acciones se mueve **arriba del Summary** | El botón queda lejos del campo cuya escritura habilita (el ABC), y "Generate" sigue leyendo del ABC. Confuso: el botón se ve en un cuadrante y usa el contenido de otro |
| **C** | Botón **en los dos** lugares — uno arriba del ABC y otro arriba del Summary | Duplica la acción; más ruido visual, mismo comportamiento |

**Recomendación: A.** Y si la intención era B, conviene saber por qué: si el problema es que
el botón "se pierde" cuando el ABC está lejos del Summary, la solución más limpia es dejarlo
donde está y llevar el par ABC + Summary más cerca visualmente.

---

## D2 · El cuadro de Goals de 97155 no existe (F5)

**Se pidió:** *"En el cuadro de Goals en 97155 diga: Describa brevemente lo que observó
durante la sesión, qué cambios o ajustes realizó, por qué fueron necesarios y cómo respondió
el miembro y/o el técnico. Puede escribir de manera informal, utilizando frases cortas o
viñetas."*

**Qué hay hoy.** El campo **Goals sólo existe en 97156**
(`SessionNote97156Form.tsx:405`, y `goals` en `useSessionNote97156Form`). El formulario de
97155 no tiene ningún campo con ese nombre: tiene cuatro narrativas —Face-to-face Protocol
Observation, Protocol Adjustments, QHP Implementation y Supervision · Active Direction—, cada
una con su guía CASP y su propio cuadro ABC.

**Dato que ayuda a leer el pedido:** el texto dictado ("qué cambios o ajustes realizó, por qué
fueron necesarios") describe exactamente lo que hace 97155 — modificación de protocolo — y el
cierre ("puede escribir de manera informal, frases cortas o viñetas") es el espíritu del
cuadro **ABC**, que son notas crudas para la IA, no texto facturable.

### Opciones

| | Opción | Qué implica |
|---|---|---|
| **A** | El texto es la guía del **cuadro ABC** de 97155 (y el de D6 es el del ABC de 97156) | Sólo front. Encaja con "puede escribir informal". Abre D7: ¿en cuál de los cuatro? |
| **B** | Se **agrega** un campo Goals a 97155, como el de 97156 | Front **+ backend**: campo nuevo en el contrato de la nota 97155. Y hay que definir si es requerido |
| **C** | El texto es la guía de una de las cuatro narrativas existentes | Sólo front. Habría que decir cuál — "Protocol Adjustments" es la que mejor calza |

**Recomendación: A o C, no B**, salvo que clínicamente haga falta un campo Goals persistido
en 97155. Si es B, hay que sumarlo al doc de backend antes de arrancar.

---

## D3 · "Descripción de la intensidad" (F12)

**Se pidió:** *"Sección de categorías y items debe salir la descripción de la intensidad y
también dar opción para que puedan escribir."*

**Qué hay hoy.** En Categories & Items del assessment cada item tiene:

- **Intensity** — select con Mild / Moderate / High.
- **Intensity description** — texto libre, ya escribible.

Los dos **sólo se muestran en items con método de colección Frequency** — decisión del
2026-08-17 (commit `03dd68b`), porque el backend sólo imprime intensidad para esos items.

### Las tres lecturas posibles

| | Lectura | Qué implica |
|---|---|---|
| **A** | *"Que se vean siempre"* — quitar el gating por Frequency | Sólo front (una línea). Pero contradice la decisión de agosto y el PDF podría no imprimirlo para el resto de los items → **habría que confirmarlo con backend** |
| **B** | *"Que se vea qué significa cada nivel"* — mostrar la definición de Mild / Moderate / High | Front, si los textos los define la clínica. Backend si tienen que ser configurables por compañía |
| **C** | *"Que salga la descripción configurada en el service plan"* y se pueda editar en el assessment | Front **+ backend** (está incluido en [B9](../docs/pedidos-backend-2026-09-05.md#b9--assessment-data-completo-del-service-plan)) |

**Recomendación:** confirmar cuál antes de tocar nada. La C es la que más se parece al resto
de los pedidos de esta tanda ("halar todo del service plan"), pero la A es la que más se
parece a la frase literal.

---

## D4 · ¿"Obligatorio en el PDF" = "obligatorio para guardar"? (F9)

**Se pidió:** que Background (+ Housing & Family), Medical History, Current Medications,
Categories & Items, Billing Codes y Providers **estén siempre en el assessment**, sin opción
de sacarlos del PDF, incluidos por default.

**El problema.** En el código de hoy el switch de PDF **es también** la condición de
obligatoriedad (`useAssessmentForm.ts:596-670`). Si se fuerzan los seis flags a `true`, pasa
a ser imposible guardar un assessment sin:

| Sección | Lo que se vuelve obligatorio |
|---|---|
| Housing & Family | Housing type + Housing/family information |
| Medical History | Other diagnosis, Morbidities, Allergies, Type of birth |
| Background | Summary + los **12** campos de background |
| Current Medications | al menos **una fila** de medicación |
| Categories & Items | al menos un item evaluado |
| Billing Codes | al menos un billing code |
| Providers | al menos un provider |

Y los mensajes de error hoy dicen *"…, or turn the section off"* — una salida que deja de
existir.

**Choque directo:** exigir una fila de medicación es incompatible con el pedido F9.3, que
justamente busca poder declarar que el cuidador **negó** que haya medicaciones.

### Opciones

| | Opción | Qué implica |
|---|---|---|
| **A** | **Separar las dos cosas.** Siempre salen en el PDF, pero lo obligatorio para guardar se define aparte (arrancando con lo mínimo: cliente y poco más) | Front. Es reversible y deja ajustar la exigencia después sin volver a tocar el layout |
| **B** | **Sí, todo obligatorio.** No se puede guardar un assessment incompleto | Front. Pero hay que resolver antes qué pasa con "denied medications" y decidir si un borrador a medio llenar deja de poder guardarse |
| **C** | Intermedia: obligatorio Categories & Items y Billing Codes; el resto sólo se imprime | Front. Hay que listar cuáles entran en cada grupo |

**Recomendación: A.** Es la que respeta el pedido literal ("por default tiene que ser
incluido") sin convertir el assessment en un formulario que no se puede guardar hasta
tenerlo perfecto. Si después se quiere endurecer, se endurece.

### ✅ Resuelto el 2026-09-05 — se implementó la opción A

Las seis secciones se imprimen siempre y perdieron el switch; **ninguna se volvió obligatoria
para guardar**, así que nada que se guardaba ayer dejó de guardarse. La decisión vive en una
sola función, `sectionBlocksSave(flags, key)` en `useAssessmentForm.ts`: hoy devuelve `false`
para las obligatorias. Endurecerla —sea para todas o para algunas, opciones B y C— es cambiar
ese `return`, sin tocar la validación ni el layout.

Queda como pregunta abierta para producto, sin bloquear nada: **¿alguna de las seis debería
además impedir guardar?** Categories & Items y Billing Codes son las candidatas naturales.

---

## D5 · ¿Qué "boxes" perdieron información? (L1)

**Se pidió:** *"Cuando estés montando algo en un box, que el sistema no pierda lo que se ha
cargado. Que se mantenga la información. Poner aviso si va a desechar o guardar."*

**Qué hay hoy.** El aviso de cambios sin guardar existe y funciona bien, pero **sólo en
Client Configuration** (`ItemDetailPanel`, `ServicePlanConfigView`, `ClientConfigurationLayout`
y los `SaveBar` de los datasheets). En el resto de la app —unos 15 modales y drawers con
formulario— cerrar con la X, con Escape o clickeando afuera tira lo cargado sin preguntar.

**Además hay un bug** en el diálogo que sí existe: tiene dos botones, y el que dice **Cancel**
en realidad **descarta y navega**. Justo lo contrario de lo que promete.

**La duda no es qué hacer** —el plan está escrito en
[Front · Fase 3](./iteracion-2026-09-05-front.md#fase-3--guard-de-cambios-sin-guardar-l1)—
sino **por dónde empezar**.

### Lo que necesitamos saber

¿En qué pantalla concreta se perdió la información? Los candidatos más pesados, por cantidad
de datos que se cargan antes de cerrar:

1. `ClientDataCollectionModal` / `ClientDataCollectionDrawer` — data collection + chart +
   baselines + objectives.
2. `ObjectiveFormModal` y `GenerateObjectivesModal`.
3. `DiagnosisFormModal`.
4. `AppointmentModal`.
5. Los modales de los steps del wizard del cliente (direcciones, caregivers, medicaciones,
   physicians, providers, seguros).

Con eso priorizamos. Si no hay una respuesta puntual, se hace en ese orden.

**Ojo, "que no se pierda lo cargado" puede querer decir dos cosas distintas:**

- **Avisar antes de descartar** — lo que dice la segunda frase del pedido. Es la Fase 3.
- **Conservar el borrador** aunque cierre el modal, para retomarlo después. Es otra cosa:
  hay que decidir dónde vive ese borrador (memoria de la sesión, `localStorage`, backend) y
  cuándo se descarta. Bastante más trabajo.

¿Cuál de las dos?

---

## D6 · Idioma de los textos de guía (F4, F5, F6)

**El detalle.** Toda la interfaz está en inglés, y las guías de las session notes son
transcripción literal de los templates CASP, también en inglés
(`lib/constants/session-note-guidance.ts`, con un comentario de cabecera que pide no
parafrasearlas sin revisar el PDF).

Los textos nuevos de D2 y de F6 vinieron dictados **en español**.

### Opciones

| | Opción | Qué implica |
|---|---|---|
| **A** | Van en español, tal cual se dictaron | Quedan dos idiomas mezclados en la misma pantalla |
| **B** | Se traducen al inglés para mantener la consistencia | Hay que aprobar la traducción |
| **C** | Se abre el tema de i18n | Fuera del alcance de esta iteración |

**Recomendación: B**, salvo que los proveedores que usan esos campos sean hispanohablantes,
en cuyo caso A y lo dejamos anotado como excepción deliberada en el archivo de guías.

### Estado 2026-09-05

Se implementó **A**: el texto de Goals de 97156 quedó en español, tal como se dictó, con un
comentario en `session-note-guidance.ts` que aclara que no sale del CASP y que el idioma fue
un pedido expreso. Cambiarlo a inglés es reemplazar un string.

---

## D7 · Los cuatro cuadros ABC de 97155 (F4)

**Se pidió:** *"En el cuadro de ABC en 97155 y 97156 se vea todo el escrito de sugerencias."*

**Qué hay hoy.** En **97156** hay un solo cuadro ABC. En **97155** hay **cuatro**, uno por
narrativa, cada uno con su propio estado (`abcBySection.faceToFace`, `.adjustments`, `.qhp`,
`.activeDirection`), y los cuatro comparten hoy la misma guía genérica `AI_ABC_GUIDANCE`.

Que la guía se vea completa está resuelto en
[Front · Fase 1](./iteracion-2026-09-05-front.md#fase-1--textos-y-guías) y aplica a los
cuatro sin decisión de nadie. Lo que hay que definir es **el contenido**.

### Opciones

| | Opción | Qué implica |
|---|---|---|
| **A** | Los cuatro siguen con la misma guía genérica de ABC | Cero trabajo extra |
| **B** | Cada uno tiene su guía, orientada a su narrativa (observación / ajustes / QHP / dirección activa) | Hay que redactar cuatro textos. Es lo más útil para el proveedor |
| **C** | El texto de [D2](#d2--el-cuadro-de-goals-de-97155-no-existe-f5) va a uno solo | Definir a cuál |

**Recomendación: B si hay tiempo de redactar los textos, A mientras tanto.** El mecanismo es
el mismo: `AiImprovableTextarea` ya recibe la guía; sólo hay que dejar de tomarla de la
constante fija y aceptarla por prop.
