# Plan: envío de BatchClaim a Claim.MD

Fecha: 2026-08-28. Continúa `plans/batch-claims.md`, que dejó el módulo hasta generar y descargar el 837P localmente. Ahora el backend lo sube al clearing house y expone estado asíncrono.

## 1. Qué hay hoy

| Pieza | Estado |
| --- | --- |
| `lib/types/batch-claim.types.ts` | Sin ningún campo `claimMd*`. `BatchClaimClientGroup` no tiene `batchClaimServiceLogId`. |
| `batch-claims.service.ts` | list, detail, elegibles, create, update, 837p, urls de preview PDF. Ninguna llamada de submission. |
| `use-batch-claim-by-id.ts` | Fetch simple, sin polling. |
| `BatchClaimDetailView.tsx` | Cabecera, totales, grupos por cliente, "Download 837P". Ningún estado de envío. |
| `BatchClaimsTable.tsx` | Listado sin columna de estado de transmisión. |
| Permisos | `PermissionModule.BILLED_CLAIMS` con view/create/edit. |

O sea: la UI hoy asume que el 837P se descarga a mano. Todo el ciclo de envío es nuevo.

## 2. Verificación contra el backend de dev

Contrastado con `https://api.dev.mentevior.com/v3/api-docs` el 2026-08-28. **Los 8 endpoints del documento existen y están desplegados.** Lo que el documento no dice y sí importa:

### 2.1 El código de éxito no es 202 en el contrato

El OpenAPI declara **solo `200`** para `POST .../submissions` y `POST .../submissions/retry`. El documento dice `202 Accepted`. Probablemente el `@ResponseStatus` no se refleja en el spec, pero el front no puede asumirlo:

> Aceptar **200 o 202** como éxito. Nunca comparar `status === 202`.

### 2.2 El 422 tampoco está en el contrato

El documento muestra errores `422` con `{ code, message, details }`. El OpenAPI declara solo `400`, `403`, `500`.

> No ramificar por código. Mostrar `message` y `details` del body venga con el código que venga. `getApiErrorMessage` ya hace la primera mitad; hay que extenderlo o envolverlo para que también arrastre `details`.

### 2.3 Todos los schemas de respuesta son `type: object`

No hay contrato de campos. Se mantiene el parseo defensivo que ya usa el módulo (`entity ?? data ?? raw`, `String(x ?? "")`, `toNumberOrNull`).

### 2.4 El endpoint "future simplification" no existe

`POST /batch-claims/{batchClaimId}/submissions/resolve-unknown` **no está**. El flujo UNKNOWN tiene que usar obligatoriamente una de las dos variantes por submission.

### 2.5 Hay endpoints desplegados que el documento no cubre

```
GET  /batch-claims/{batchClaimId}/remittances
GET  /claim-remittances/{remittanceId}
POST /claim-remittances/{remittanceId}/reconcile
GET  /claim-md/unmatched
GET  /claim-md/reference-code/catalog
GET  /claim-md/webhook (+ POST)
```

El documento define `PAID` / `PARTIAL` / `DENIED`, `claimMdPaidAmount` y `claimMdReconciliationStatus` pero **no dice cómo leer el detalle de remesa**. Estos endpoints son ese camino. Queda fuera del alcance inicial (fase 7) hasta que producto defina la pantalla de conciliación.

### 2.6 Dependencia confirmada (ver sección 8)

`GET /batch-claims/{batchClaimId}` debe devolver `batchClaimServiceLogId` dentro de cada `appointments[]`. El ejemplo del documento lo trae, pero el schema es `type: object` y el parser actual lo descarta. **Todo el flujo UNKNOWN depende de ese campo.** Primera cosa a comprobar con un batch real (fase 1).

## 3. Decisión de arquitectura

El documento trae tres tablas de decisión (batch-level, resolución de UNKNOWN, y la combinada de tres estados). Si esas tablas se traducen a condicionales dentro del JSX, se van a desincronizar en la primera modificación — es exactamente lo que pasó con los tres bloques de reset del modal de diagnósticos.

> Las tablas viven en **un módulo puro**, `lib/modules/batch-claims/claim-md-status.ts`, sin React y sin fetch. La UI no decide nada: consulta.

La regla más importante del documento entra ahí y no se puede saltar desde ningún componente:

> Nunca ofrecer retry por `submissionStatus = REJECTED`. Rejected significa que Claim.MD **sí** respondió. Retry es exclusivamente para `transmissionStatus = FAILED`.

## 4. Arquitectura propuesta

### 4.1 Tipos — `lib/types/claim-md.types.ts` (nuevo)

```ts
export type ClaimMdTransmissionStatus =
  | "CREATED" | "UPLOADING" | "RECEIVED" | "PARTIAL" | "REJECTED" | "UNKNOWN" | "FAILED"

export type ClaimMdSubmissionStatus =
  | "CREATED" | "UPLOADING" | "ACKNOWLEDGED" | "ACCEPTED" | "REJECTED" | "UNKNOWN"

export type ClaimMdAdjudicationStatus =
  | "NOT_ADJUDICATED" | "PAID" | "PARTIAL" | "DENIED"

/** POST /batch-claims/{id}/submissions */
export interface ClaimMdSubmitResult {
  transmissionId: string
  status: ClaimMdTransmissionStatus | null
  fileName: string
  externalFileId: string | null
  claimCount: number
}

/** POST /batch-claims/{id}/submissions/retry */
export interface ClaimMdRetryResult {
  transmissionId: string
  transmissionStatus: ClaimMdTransmissionStatus | null
  attemptCount: number
  externalFileId: string | null
  submissionCount: number
}

/** Fila de GET /batch-claims/{id}/submissions */
export interface ClaimMdSubmissionSummary {
  submissionId: string
  transmissionId: string
  batchClaimServiceLogId: string
  submissionStatus: ClaimMdSubmissionStatus | null
  adjudicationStatus: ClaimMdAdjudicationStatus | null
  transmissionStatus: ClaimMdTransmissionStatus | null
  fileName: string
  remoteClaimId: string | null
  patientControlNumber: string | null
  claimMdClaimId: string | null
  claimMdFileId: string | null
  totalCharge: number | null
  submittedAt: string | null
  lastResponseAt: string | null
}

export interface ClaimMdSubmissionLine { /* id, appointmentId, lineNumber, serviceDate,
  procedureCode, modifiers, placeOfService, units, chargeAmount, remoteChargeId,
  renderingProviderNpiSnapshot, renderingProviderTaxonomySnapshot */ }

export interface ClaimMdSubmissionResponse { /* id, externalResponseId, messageId,
  externalStatus, message, responseAt */ }

/** GET /claim-submissions/{id} y la variante por service-log */
export interface ClaimMdSubmissionDetail extends ClaimMdSubmissionSummary {
  batchClaimId: string
  payloadChecksum: string | null
  payerExternalIdSnapshot: string | null
  billingNpiSnapshot: string | null
  billingTaxIdSnapshot: string | null
  lines: ClaimMdSubmissionLine[]
  responses: ClaimMdSubmissionResponse[]
}

/** POST .../resolve-unknown (ambas variantes) */
export interface ClaimMdResolveUnknownResult {
  transmissionId: string
  transmissionStatus: ClaimMdTransmissionStatus | null
  foundInUploadList: boolean
  message: string
}
```

Los tres tipos se declaran como unión de literales pero se parsean con un `asStatus()` tolerante: un valor desconocido cae a `null`, no rompe la pantalla.

### 4.2 Ampliación de `batch-claim.types.ts`

```ts
export interface BatchClaimClientGroup {
  // ...lo existente
  /** Necesario para el flujo UNKNOWN y para enlazar el grupo con su submission. */
  batchClaimServiceLogId: string
}

export interface BatchClaim {
  // ...lo existente
  claimMdTransmissionStatus: ClaimMdTransmissionStatus | null
  claimMdSubmissionStatus: ClaimMdSubmissionStatus | null
  claimMdAdjudicationStatus: ClaimMdAdjudicationStatus | null
  claimMdLastResponseAt: string | null
  claimMdHasRemittance: boolean
  claimMdPaidAmount: number | null
  claimMdReconciliationStatus: string | null
}
```

`BatchClaimSummary` **no** los lleva: el listado paginado no los documenta. Si el backend los devuelve, se añaden ahí y la columna de la fase 6 sale gratis; si no, esa columna necesita otra fuente y se decide entonces.

### 4.3 Módulo de estado — `lib/modules/batch-claims/claim-md-status.ts` (nuevo, puro)

```ts
interface ClaimMdBatchDecision {
  label: string                  // "Uploading to Claim.MD", "Rejected", ...
  tone: "neutral" | "info" | "success" | "warning" | "danger"
  description: string            // frase para el usuario
  shouldPoll: boolean            // CREATED | UPLOADING
  canSubmit: boolean             // solo transmissionStatus === null
  canRetry: boolean              // solo FAILED
  canResolveUnknown: boolean     // solo UNKNOWN
  showsClaimLevelDetail: boolean // RECEIVED | PARTIAL | REJECTED
}

export function getBatchDecision(status: ClaimMdTransmissionStatus | null): ClaimMdBatchDecision
export function getSubmissionBadge(s: ClaimMdSubmissionStatus | null): { label, tone }
export function getAdjudicationBadge(a: ClaimMdAdjudicationStatus | null): { label, tone }
/** Fila de la tabla combinada del documento, para el texto de resumen. */
export function describeCombined(t, s, a): string
```

Traducción directa de las tres tablas del documento. Es el único sitio donde se decide qué botón se ve.

### 4.4 Servicio — `lib/modules/batch-claims/services/claim-md.service.ts` (nuevo)

Archivo aparte de `batch-claims.service.ts`, que ya tiene 264 líneas y otra responsabilidad.

```ts
submitBatchClaim(batchClaimId): Promise<ClaimMdSubmitResult>
retryBatchClaimSubmission(batchClaimId): Promise<ClaimMdRetryResult>
getBatchClaimSubmissions(batchClaimId): Promise<ClaimMdSubmissionSummary[]>
getSubmissionByServiceLog(batchClaimId, batchClaimServiceLogId): Promise<ClaimMdSubmissionDetail | null>
getSubmissionById(submissionId): Promise<ClaimMdSubmissionDetail | null>
resolveUnknownByServiceLog(batchClaimId, batchClaimServiceLogId): Promise<ClaimMdResolveUnknownResult>
resolveUnknownBySubmissionId(submissionId): Promise<ClaimMdResolveUnknownResult>
```

Reglas para los dos POST de escritura:

```ts
const OK = (s: number) => s === 200 || s === 201 || s === 202   // ver 2.1
```

y un error que conserve el `details` del backend, porque los 422 del documento lo usan para explicar qué hacer ("Retry must use the Batch Claim retry flow…"). Un `Error` con solo `message` pierde la mitad útil del mensaje.

### 4.5 Hooks — `lib/modules/batch-claims/hooks/`

- `use-claim-md-submit.ts` — `{ submit, retry, isSubmitting, isRetrying, error }`, toast por sonner, devuelve `null` en error como el resto del módulo.
- `use-batch-claim-submissions.ts` — lista por batch, con `refetch`.
- `use-claim-md-resolve-unknown.ts` — `{ resolve, isResolving }`, prefiere la variante por `batchClaimServiceLogId` y cae a la de `submissionId`.
- **`use-batch-claim-by-id.ts` — se modifica**, no se duplica: acepta `{ poll?: boolean }` y, cuando el estado lo pide, refresca solo.

### 4.6 Polling

Vive dentro de `useBatchClaimById`, gobernado por `getBatchDecision(...).shouldPoll`:

- Intervalo 4 s durante el primer minuto, 10 s después.
- Corte duro a los 5 minutos → deja de sondear y muestra "Sigue procesando" con un botón de refrescar manual. Un polling infinito contra un backend que quedó colgado es peor que un botón.
- Pausa con `document.hidden` y reanuda con un fetch inmediato al volver a la pestaña.
- `clearInterval` en cleanup y guard de request obsoleta (`activeRef`, como `useDiagnosisCatalogSearch`).
- Nunca sondea si `shouldPoll` es false: `RECEIVED`, `PARTIAL`, `REJECTED`, `FAILED` y `UNKNOWN` son terminales para el ciclo de subida.

La adjudicación **no se sondea**. Llega por ERA horas o días después; se ve al volver a entrar.

### 4.7 UI

**`ClaimMdStatusPanel.tsx`** — reemplaza el bloque de botones del header en `BatchClaimDetailView`:

- Badge de transmisión + frase de `describeCombined`.
- Acción única según `getBatchDecision`: `Submit to Claim.MD` / nada / `Retry upload` / `Verify in Claim.MD`.
- `Download 837P` se queda siempre visible.
- Submit y retry piden confirmación (`alert.confirm`): son irreversibles y facturan.
- Mientras `isSubmitting || isRetrying || shouldPoll`, ambos botones deshabilitados. Submit **no es idempotente** — el backend responde 422 "Batch Claim already has a Claim.MD submission" — así que el doble clic se corta en el front.
- Fila con `claimMdLastResponseAt`, y `claimMdPaidAmount` cuando `claimMdHasRemittance`.

**`ClaimMdSubmissionsPanel.tsx`** — visible cuando `showsClaimLevelDetail`. Una fila por submission, cruzada con el grupo de cliente por `batchClaimServiceLogId` para poder mostrar el nombre del cliente en vez de un UUID. Badges de submission y adjudicación, `claimMdClaimId`, `totalCharge`, y "Ver detalle".

**`ClaimMdSubmissionDetailModal.tsx`** — `CustomModal` con `constrainHeight` (ver el bug del modal de diagnósticos: sin eso el footer se sale de pantalla). Cabecera con ids y snapshots, tabla de `lines`, y `responses` en orden cronológico — que es lo que el usuario necesita leer para arreglar un rechazo.

**Grupos de cliente** — badge de submission en la cabecera de cada grupo de `BatchClaimDetailView`, resuelto por `batchClaimServiceLogId`.

**Flujo UNKNOWN** — `Verify in Claim.MD` abre un modal que explica que se va a consultar el `uploadlist` sin reenviar nada, llama a resolve, y según el resultado:

| Resultado | Acción |
| --- | --- |
| `foundInUploadList: true` → `RECEIVED` | Refresca el batch. No ofrecer retry. |
| `foundInUploadList: false` → `FAILED` | Refresca el batch; el panel ya ofrece `Retry` por el flujo normal. |

Detalle no obvio: los submissions de un batch comparten `transmissionId`, así que resolver **uno** resuelve la transmisión entera. Se llama una sola vez con el primer submission en `UNKNOWN` y se refresca el batch; no hay que iterar.

## 5. Fases

Implementadas las fases 1–7. La 8 sigue bloqueada por definición de producto.

| # | Alcance | Estado | Archivos |
| --- | --- | --- | --- |
| 1 | Tipos + servicio + parsers | Hecho | `lib/types/claim-md.types.ts`, `services/claim-md.service.ts`, `batch-claim.types.ts`, `batch-claims.service.ts` |
| 2 | Tablas de decisión | Hecho | `lib/modules/batch-claims/claim-md-status.ts` |
| 3 | Polling y hooks | Hecho | `use-batch-claim-by-id.ts`, `use-claim-md-actions.ts`, `use-batch-claim-submissions.ts` |
| 4 | Panel de estado, submit, retry | Hecho | `ClaimMdStatusPanel.tsx`, `ClaimMdStatusBadge.tsx` |
| 5 | Estado por claim y detalle | Hecho | `ClaimMdSubmissionsPanel.tsx`, `ClaimMdSubmissionDetailModal.tsx` |
| 6 | Flujo UNKNOWN | Hecho | `ClaimMdVerifyUnknownModal.tsx` |
| 7 | Columna en el listado | Hecho, condicional | `BatchClaimsTable.tsx` |
| 8 | Remesas y conciliación | Pendiente de producto | — |

Sobre la 7: `claimMdTransmissionStatus` se declaró **opcional** en `BatchClaimSummary` y se parsea si viene. La columna aparece sola el día que el backend la envíe y no rompe nada mientras tanto.

### Bloqueo tras el envío

Respondida la pregunta 3: **un batch enviado no se puede editar** (confirmado con backend). `ClaimMdBatchDecision.isLocked` es `true` en cuanto existe transmisión, y con eso:

- El detalle cambia el botón "Edit" por un indicador `Locked after submission`.
- El lápiz del listado desaparece para esos batches.
- `/{id}/edit` es accesible por URL directa, así que la propia página muestra el bloqueo en vez del formulario.

## 6. Riesgos

1. **`batchClaimServiceLogId` puede no llegar.** Bloquea las fases 5 y 6 enteras. Es lo primero a comprobar.
2. **Submit no es idempotente.** Un doble clic o un reintento del usuario deja un 422. Se mitiga en el front, pero conviene confirmar que el 422 no crea nada a medias en el backend.
3. **El 202 no está en el contrato.** Si alguien escribe `status === 202` la pantalla se rompe el día que el backend normalice a 200.
4. **Los tres estados pueden llegar desalineados** entre `GET /batch-claims/{id}` (agregado) y `GET .../submissions` (por claim), porque son dos lecturas distintas. La UI debe tratar el agregado como la fuente para decidir acciones y el por-claim solo para mostrar detalle — que es justo lo que dice el documento.
5. **`REJECTED` a nivel de claim no es un fallo de envío.** Si alguien cablea un botón de retry a ese badge, se duplican claims en el clearing house. Por eso `canRetry` vive en un solo sitio.

## 7. Preguntas abiertas

1. ~~¿`GET /batch-claims` devuelve los campos `claimMd*`?~~ **Respondido: sí.** Verificado contra dev; la columna ya se muestra.
2. ¿Qué permiso gobierna submit y retry? Implementado con `edit` sobre `BILLED_CLAIMS`. Sin ese permiso el estado se ve igual, sólo desaparecen los botones.
3. ~~¿Un batch ya enviado se puede seguir editando?~~ **Respondido: no.** Implementado, ver la sección 5.
4. ¿Qué pantalla quiere producto para remesas y conciliación (fase 8)?

## 8. Cambio de contrato 2026-08-28: estado único

El backend colapsa los tres estados en uno: `claimMdEffectiveStatus` en el BatchClaim
y `effectiveStatus` en cada claim. Se retiran del contrato público
`claimMdTransmissionStatus`, `claimMdSubmissionStatus`, `claimMdAdjudicationStatus`,
`claimMdReconciliationStatus`, `submissionStatus`, `adjudicationStatus`,
`transmissionStatus`, `paymentStatus`, `allowedActions` y `responses[].externalStatus`.

**El cambio todavía no está desplegado en dev**: la API sigue devolviendo el contrato
anterior. Migrar en frío dejaría todas las pantallas en "Not submitted", así que el
front lee `effectiveStatus` si viene y, si no, lo deriva de los tres estados viejos
(`deriveEffectiveStatus` en `claim-md-status.ts`). El día que backend despliegue no hay
que coordinar nada; cuando dev y producción estén en el contrato nuevo se borra la
derivación, los tipos `@deprecated` y `readEffectiveStatus`.

La correspondencia entre contratos:

| Anterior | Nuevo |
| --- | --- |
| `transmission = null` | `NOT_SUBMITTED` |
| `CREATED` | `PREPARING` |
| `UPLOADING` | `PROCESSING` |
| `FAILED` | `UPLOAD_FAILED` |
| `UNKNOWN` | `VERIFY_REQUIRED` |
| `RECEIVED` + submission `ACKNOWLEDGED` / `ACCEPTED` / `REJECTED` | el del claim |
| `PARTIAL` | `PARTIAL` |
| adjudication `PAID` / `PARTIAL` / `DENIED` | `PAID` / `PARTIALLY_PAID` / `DENIED` |

La regla crítica sobrevive intacta: `canRetry` sólo con `UPLOAD_FAILED`. Verificado con
33 aserciones sobre el módulo real, incluida la de que ningún otro estado —`REJECTED`
entre ellos— ofrece retry.

## 9. Verificación contra dev (2026-08-28, compañía Sample Practice)

Ejecutado contra la API real con sesión activa. **Los cuatro endpoints de lectura devuelven exactamente los campos que el contrato dice.**

| Comprobación | Resultado |
| --- | --- |
| `batchClaimServiceLogId` en `appointments[]` de `GET /batch-claims/{id}` | **Sí llega.** Era el bloqueante de las fases 5 y 6; queda resuelto |
| `GET /batch-claims` devuelve los `claimMd*` | **Sí**, los siete campos. La columna del listado se muestra sola |
| `GET /batch-claims/{id}/submissions` | Array plano con las 14 claves esperadas |
| `GET .../service-logs/{slId}/submission` | Detalle completo, con `lines` (4) y `responses` (2) |
| Cruce claim ↔ nombre de cliente por `batchClaimServiceLogId` | Funciona: la tabla muestra "Cuquita La mora", no un UUID |
| Bloqueo tras envío | El lápiz desaparece del listado y el detalle muestra `Locked after submission` |

Probado sobre `bc100001-…0001` (`RECEIVED` / `ACKNOWLEDGED` / `NOT_ADJUDICATED`), que trae dos respuestas reales de Claim.MD y cuatro líneas de servicio.

### Bug encontrado y corregido durante la verificación

`bc100001-…0003` tiene **0 service logs, 0 appointments y $0.00**, y aun así ofrecía `Submit to Claim.MD` — habría subido un 837P vacío al clearing house. Ahora el botón se deshabilita y el panel explica por qué.

### Lo que no se probó, a propósito

`submit`, `retry` y `resolve-unknown` son escrituras que **suben de verdad al clearing house**. No se dispararon sin autorización explícita. Falta por tanto confirmar:

1. Si submit responde 200 o 202 (se aceptan ambos).
2. Si el error de "ya tiene submission" llega con `details`.
3. El ciclo de polling completo: submit → `UPLOADING` → estado final, y que el sondeo pare solo.

### Para preguntar a backend

En `bc100001-…0001` el `submissionStatus` es `ACKNOWLEDGED`, pero las dos respuestas de Claim.MD vienen con `externalStatus: "R"` y los mensajes `Rendering NPI Fails LUHN check` y `Referring NPI Fails LUHN check`. Si `R` significa rechazo, ese claim debería mapear a `REJECTED`, no a `ACKNOWLEDGED`. Puede ser dato semilla, pero conviene confirmarlo porque la UI se apoya en ese estado para decidir qué enseñar.
