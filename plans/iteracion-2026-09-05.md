# Iteración 2026-09-05 — índice de pedidos

> Origen: pedidos de Lidia (`L*`) y de Frank (`F*`) recogidos el 2026-09-05.
> Este archivo es el **índice trazable**: cada pedido tiene un id estable, un destino y un
> link al plan que lo desarrolla. Los ids se usan en los commits y en los otros tres docs.

## Los tres bloques

| Bloque | Archivo | Qué contiene |
|---|---|---|
| Front | [`plans/iteracion-2026-09-05-front.md`](./iteracion-2026-09-05-front.md) | Lo que se puede construir ya, sin backend y sin romper nada. Fases, archivos, riesgos y criterios de aceptación |
| Backend | [`docs/pedidos-backend-2026-09-05.md`](../docs/pedidos-backend-2026-09-05.md) | Pedido formal a backend: contratos propuestos, justificación y criterios de aceptación |
| Definiciones | [`plans/iteracion-2026-09-05-definiciones.md`](./iteracion-2026-09-05-definiciones.md) | Lo que está bloqueado por una decisión de producto, con las opciones y el impacto de cada una |

## Tabla maestra

| Id | Pedido | Origen | Destino | Estado |
|---|---|---|---|---|
| **F1** | Función hipotética en el service plan bajo cada programa y maladaptive behavior (attention, tangible, escape, sensory) | Frank | — | ✅ Hecho (`6cef174`) |
| **F7** | Email en 2 agencias → cuadrante para escoger compañía | Frank | — | ✅ Hecho (`543c292`) |
| **F4** | En el cuadro ABC de 97155 y 97156 se vea todo el escrito de sugerencias | Frank | Front | ✅ Hecho — [Front · Fase 1](./iteracion-2026-09-05-front.md#fase-1--textos-y-guías) |
| **F6** | Texto nuevo en el cuadro de Goals de 97156 | Frank | Front | ✅ Hecho — [Front · Fase 1](./iteracion-2026-09-05-front.md#fase-1--textos-y-guías) |
| **F9.1** | Housing & Family adentro de Background | Frank | Front | ✅ Hecho — [Front · Fase 2](./iteracion-2026-09-05-front.md#fase-2--assessment-secciones-obligatorias) |
| **F9.2a** | Quitar el mensaje "se captura automáticamente al crear el documento" | Frank | Front | ✅ Hecho — [Front · Fase 2](./iteracion-2026-09-05-front.md#fase-2--assessment-secciones-obligatorias) |
| **F9.4** | Categories & Items obligatorio en el PDF | Frank | Front | ✅ Hecho — [Front · Fase 2](./iteracion-2026-09-05-front.md#fase-2--assessment-secciones-obligatorias) |
| **F9.5** | Billing Codes obligatorio en el PDF | Frank | Front | ✅ Hecho — [Front · Fase 2](./iteracion-2026-09-05-front.md#fase-2--assessment-secciones-obligatorias) |
| **L1** | No perder lo cargado en un box; avisar si va a desechar o guardar | Lidia | Front | ✅ Infraestructura + 4 pantallas — [Front · Fase 3](./iteracion-2026-09-05-front.md#fase-3--guard-de-cambios-sin-guardar-l1) |
| **L3** | Pantalla con todas las gráficas de maladaptive, replacements y caregivers | Lidia | Front (+ backend deseable) | ✅ Hecho — [Front · Fase 4](./iteracion-2026-09-05-front.md#fase-4--pantalla-de-todas-las-gráficas-l3) · [B7](../docs/pedidos-backend-2026-09-05.md#b7--endpoint-agregado-de-gráficas-por-cliente) |
| **L2** | Environmental changes con 3 modos de visualización a elección del proveedor | Lidia | Front + Backend | 🔧 [B1](../docs/pedidos-backend-2026-09-05.md#b1--modo-de-visualización-de-environmental-changes-en-el-chart) |
| **F2** | Más de un teaching procedure por item | Frank | Front + Backend | 🔧 [B2](../docs/pedidos-backend-2026-09-05.md#b2--teaching-procedure-de-uno-a-muchos) |
| **F8** | Lista de Other providers debajo de Providers en el cliente | Frank | Front + Backend | 🔧 [B3](../docs/pedidos-backend-2026-09-05.md#b3--other-providers-asociados-al-cliente) |
| **F9.2b** | Medical history: ver y editar el diagnóstico en pantalla | Frank | Front + Backend | 🔧 [B4](../docs/pedidos-backend-2026-09-05.md#b4--diagnóstico-del-assessment-visible-y-editable) |
| **F9.3** | Current medications: checkmark "caregiver denied any medications at this time" | Frank | Front + Backend | 🔧 [B5](../docs/pedidos-backend-2026-09-05.md#b5--caregiver-denied-any-medications-at-this-time) |
| **F9.6** | Providers del assessment: BCBA halado del service plan + other providers con especialidad | Frank | Front + Backend | 🔧 [B6](../docs/pedidos-backend-2026-09-05.md#b6--providers-del-assessment-halados-del-service-plan) |
| **F10** | Other services: Speech / OT / PT / Feeding (yes/no) + other + lugar | Frank | Front + Backend | 🔧 [B8](../docs/pedidos-backend-2026-09-05.md#b8--other-services-terapias-activas) |
| **F11** | Halar todo el service plan al assessment (pantalla + PDF) | Frank | Front + Backend | 🔧 [B9](../docs/pedidos-backend-2026-09-05.md#b9--assessment-data-completo-del-service-plan) |
| **L4a** | Service log: por el ojito no sale nada | Lidia | Reproducir + Backend | 🔧 [B10](../docs/pedidos-backend-2026-09-05.md#b10--service-log-vacío-visto-desde-el-ojito) |
| **L4b** | Si se cambia la nota (fecha, lugar de servicio…), que el service log se actualice | Lidia | Backend | 🔧 [B11](../docs/pedidos-backend-2026-09-05.md#b11--service-log-que-refleje-los-cambios-de-la-nota) |
| **L5** | Que pase a billing cuando el service log esté bloqueado | Lidia | Backend | 🔧 [B12](../docs/pedidos-backend-2026-09-05.md#b12--bloqueo-del-service-log-y-paso-a-billing) |
| **F3** | Botón "Generate with AI" en el cuadrante de summary | Frank | Definición | ❓ [D1](./iteracion-2026-09-05-definiciones.md#d1--dónde-va-el-botón-de-generate-with-ai-f3) |
| **F5** | Texto nuevo en el cuadro de Goals de 97155 | Frank | Definición | ❓ [D2](./iteracion-2026-09-05-definiciones.md#d2--el-cuadro-de-goals-de-97155-no-existe-f5) |
| **F12** | Categories & Items: descripción de la intensidad y poder escribir | Frank | Definición | ❓ [D3](./iteracion-2026-09-05-definiciones.md#d3--descripción-de-la-intensidad-f12) |
| **F9.x** | ¿"Obligatorio en el PDF" implica "obligatorio para guardar"? | Frank | Definición | ✅ Resuelto: opción A — [D4](./iteracion-2026-09-05-definiciones.md#d4--obligatorio-en-el-pdf--obligatorio-para-guardar-f9) |
| **L1.x** | ¿En qué pantallas se perdió lo cargado? | Lidia | Definición | ❓ [D5](./iteracion-2026-09-05-definiciones.md#d5--qué-boxes-perdieron-información-l1) |
| **F4/F5/F6** | ¿Los textos de guía van en español o traducidos al inglés? | Frank | Definición | ❓ [D6](./iteracion-2026-09-05-definiciones.md#d6--idioma-de-los-textos-de-guía-f4-f5-f6) |
| **F4.x** | En 97155 hay 4 cuadros ABC — ¿el texto va a los cuatro? | Frank | Definición | ❓ [D7](./iteracion-2026-09-05-definiciones.md#d7--los-cuatro-cuadros-abc-de-97155-f4) |

## Estado — 2026-09-05

**El bloque de front está construido.** Las cuatro fases entraron; `tsc` y `next build` pasan.
El detalle de lo que se desvió del plan está en
[`plans/iteracion-2026-09-05-front.md`](./iteracion-2026-09-05-front.md#-estado--implementado-2026-09-05).

Lo que queda:

- **Mandar** [`docs/pedidos-backend-2026-09-05.md`](../docs/pedidos-backend-2026-09-05.md).
- **Responder D1, D2, D3, D5, D6 y D7** (D4 quedó resuelta al implementar).
- Con D5 respondida, terminar la adopción del guard en los modales del wizard del cliente.

## Orden de ataque sugerido

1. ~~Front, fases 1 a 4~~ — hechas el 2026-09-05.
2. **Mandar el doc de backend**: B2, B3, B8 y B9 son los de mayor tiempo de cocción; B10, B11 y B12 desbloquean todo el service log.
3. **Responder D1, D2, D3, D5, D6 y D7** — la mayoría son de un renglón y desbloquean trabajo de front puro.
4. Con D5 en mano, cerrar el guard en los modales del wizard del cliente.
5. Con las respuestas de backend, arrancar por B9 (es el que más pantallas destraba a la vez).

## Contexto previo relacionado

- [`docs/ajustes-backend-2026-09-03-hypothesized-function.md`](../docs/ajustes-backend-2026-09-03-hypothesized-function.md) — el cierre de F1, con sus pendientes abiertos.
- [`plans/assessment.md`](./assessment.md) — el plan original del módulo, con el contrato completo.
- [`plans/service-log.md`](./service-log.md) — Q1–Q9; la Q9 explica el service log vacío de L4a.
- [`docs/contexto-datacollection-grafico-sessionnote.md`](../docs/contexto-datacollection-grafico-sessionnote.md) — el mapa de charts, datasheets y session notes que usan L2 y L3.
