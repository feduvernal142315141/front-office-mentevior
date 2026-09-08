# Contratos entregados por backend — 2026-09-07

> Índice de la iteración: [`plans/iteracion-2026-09-05.md`](../plans/iteracion-2026-09-05.md)
> Pedido original: [`docs/pedidos-backend-2026-09-05.md`](./pedidos-backend-2026-09-05.md)
>
> Backend entregó cuatro contratos el 2026-09-07. Este documento registra, por cada uno,
> **qué llegó**, **cómo se adaptó el front**, **qué quedó faltando** y **qué preguntas siguen
> abiertas**. Es el papel de trabajo de la adaptación: lo que se decidió y por qué.

## Resumen

| Contrato | Pedido | Estado del front | Commit |
|---|---|---|---|
| [Claim.MD payer catalog](#claimmd-payer-catalog-enrollment-status) | — (iniciativa de backend) | ✅ Adaptado, con una regresión pendiente | `db8d885` |
| [B2 · Teaching procedures e hypothesized functions](#b2--teaching-procedures-e-hypothesized-functions) | F2 | ✅ Completo | `52a04b2` |
| [B5 · Current medications denied](#b5--current-medications-denied) | F9.3 | ✅ Completo | `d1d2901` |
| [B1 · Environmental changes display](#b1--environmental-changes-display) | L2 | ⚠️ Parcial — falta un campo | `3e7b6e7` |

---

## Claim.MD payer catalog enrollment status

### Qué llegó

1. La búsqueda del catálogo (`GET /clearing-houses/{id}/payer-catalog/search`) se simplificó:
   `professionalClaims` → `supportsProfessionalClaims`, `eraStatus` → `supportsEra`, y se
   fueron los campos de institutional, dental, eligibility y attachments.
2. `GET /payers/{id}` suma esos dos flags para los payers de Claim.MD.
3. Al crear un payer de Claim.MD, si el catálogo dice que 1500 o ERA no requieren alta
   manual, el backend crea el `claim_md_provider_enrollment` solo, con `status = COMPLETED`,
   `processingStatus = MATCHED` y `externalStatus` con el valor crudo del catálogo.
4. **`claimMdEnrollments[*].status` pasa a devolver `externalStatus` cuando existe**, y
   `externalStatus` deja de venir como campo propio.

### Cómo se adaptó el front

- `Payer` y `PayerCatalogSearchItem` incorporan los flags. Los campos que se fueron del
  search no los leía nadie, así que quitarlos no rompió nada.
- **Badges 1500 / ERA sobre el External ID**: en cada sugerencia del catálogo, para elegir
  con criterio, y debajo del campo del payer ya guardado.
- **Los botones Enroll salen según el flag**, con dos reglas propias:
  - `undefined` **no** se trata como `false`. Un payer viejo, o un External ID tipeado a
    mano fuera del catálogo, no trae los flags; esconder el botón por falta de dato dejaría
    al usuario sin manera de enrolarse. Sólo un `false` explícito lo oculta, y si los dos
    vienen en `false` la sección explica por qué no hay nada que hacer.
  - Tampoco sale si ya hay un enrollment vivo de ese tipo. La regla del backend es uno
    activo por compañía + payer + tipo, así que ofrecerlo de nuevo sólo lleva a un error —
    y con la auto-creación, ese es ahora el caso normal.
- **El External ID queda bloqueado** cuando el payer tiene un enrollment vivo: es lo que lo
  identifica ante Claim.MD y cambiarlo dejaría el enrollment apuntando a otro payer. Los
  **rechazados no bloquean**: si el enrollment se cayó porque el ID estaba mal, hay que poder
  corregirlo.

### ⚠️ Regresión abierta — la columna Status queda vacía

`asEnrollmentStatus()` normaliza contra un enum cerrado de seis valores
(`REQUESTED`, `ENROLLED`, `RECEIVED`, `COMPLETED`, `REJECTED`, `UNKNOWN`) y lo que no matchea
cae a `null`. Con el contrato nuevo, `"no enrollment required"` no está en el enum, así que
la tabla pinta **"—"** justo en los registros auto-creados, que después de este cambio son la
mayoría. Y como `externalStatus` ya no viene por separado, el tooltip que mostraba el valor
crudo también queda vacío.

Además se pierde información: ya no se puede distinguir "COMPLETED porque el proveedor
terminó el flujo" de "COMPLETED porque el payer no requiere enrollment".

**Lo que pedimos:** que `status` vuelva a ser el enum normalizado y `externalStatus` siga
siendo un campo propio. Si se prefiere dejarlo colapsado, necesitamos **la lista cerrada de
los valores crudos posibles** para poder mapearlos a etiquetas.

**Mientras tanto** el front no tiene parche: se decidió no inventar un mapeo contra una lista
que no conocemos. Es un cambio de cinco minutos cuando llegue la respuesta.

### Preguntas abiertas

1. ¿Qué devuelve el `POST` de enrollment sobre un payer que ya tiene el registro
   auto-creado? ¿409, reemplazo, o link nuevo? Hoy el front sólo muestra el mensaje de error
   que venga; el botón está escondido, pero queremos saber el comportamiento igual.
2. Con `supportsProfessionalClaims: false`, ¿se esconde el botón o se muestra deshabilitado
   con el motivo? Hoy se esconde.
3. **¿Hubo backfill?** La auto-creación dispara "when a Claim.MD payer is created". Los
   payers anteriores a este cambio, ¿recibieron su registro? Si no, dos payers idénticos se
   ven distinto según cuándo se cargaron.
4. ¿Se re-evalúa al cambiar el `externalId` de un payer ya creado?
5. El mismo `externalPayerId` devuelve nombres distintos —`68069` es `Ambetter` en el
   ejemplo del contrato y `Centene` en dev—. Si un External ID tiene varias entradas en el
   catálogo, ¿cuál usa el backend para resolver los flags del detalle?
6. El bloqueo del External ID hoy es sólo visual: el `PUT` lo sigue aceptando. Si es regla de
   negocio, debería rechazarse con 422.
7. Combinando el bloqueo con la auto-creación, **el momento de crear el payer es casi la
   única oportunidad de escribir bien el External ID**. ¿Hace falta un endpoint para cancelar
   un enrollment, o un rol que pueda saltear el bloqueo?

---

## B2 · Teaching procedures e hypothesized functions

### Qué llegó

- `PUT …/level` acepta `teachingProcedureIds: string[]` y `hypothesizedFunction: string[]`;
  ambos reemplazan la colección completa y `[]` la limpia.
- Los dos GET (`…/level` y el listado por categoría) devuelven `teachingProcedures`
  **resueltos** (`{ id, name }`) y **ya no devuelven** `teachingProcedureId`.
- Assessment recibe y devuelve `hypothesizedFunction` como lista; el PDF imprime los valores
  separados por `;`.
- Los registros antiguos vuelven como lista de un elemento. El singular legacy se sigue
  aceptando **en el request**.

### Cómo se adaptó el front

- Los mappers leen `teachingProcedures`; si un entorno viejo devuelve el id suelto, lo toman
  como lista de uno sin nombre y la pantalla lo resuelve contra el catálogo como antes.
- `parseHypothesizedFunctions()` acepta las tres formas posibles: la lista nueva, el valor
  suelto de los registros viejos y la cadena serializada con `;` de la columna. Descarta lo
  que no sea del enum y no repite.
- En el DTO del front los campos van en **plural** (`teachingProcedureIds`,
  `hypothesizedFunctions`) para que el tipo no mienta. Que la clave de la API siga siendo
  singular queda contenido en el service, que es el único que habla wire.
- Los dos selects del item pasaron a `MultiSelect`, con `tone="neutral"` y
  `maxVisibleTags={2}` — el mismo tratamiento que Member User Types y Billing Codes en el
  formulario de Users.
- El dirty-check compara la selección **ordenada y serializada**: reordenar no es un cambio,
  porque el backend reemplaza la colección igual.
- En la tabla de items del service plan la celda de Teaching Procedure muestra el primero con
  un `+N` y todos en el tooltip: la columna es angosta y apilarlos rompía la fila.
- En el Assessment la función hipotetizada también es `MultiSelect`, y la precarga del
  Service Plan sigue siendo precarga: se muestra hasta que el usuario elige, y lo que viaja
  es lo que ve.

### ⚠️ Riesgo para otros consumidores

El contrato mantiene `teachingProcedureId` en el **request** pero lo quita del **response**.
Una pantalla no migrada hace `GET`, no encuentra el id, guarda vacío y **borra los teaching
procedures del item**. Nuestro front está migrado entero, pero si hay otro consumidor —el
backoffice de `mente-vior`, un script, una app móvil— le pasa en silencio.

### Preguntas abiertas

1. ¿Qué pasa con un id de teaching procedure repetido o inexistente? ¿Deduplica, ignora, 422?
2. Al clonar el service plan de la compañía al del cliente, ¿los teaching procedures se
   copian como lista? Si el clonado usa el camino legacy —"los campos singulares se mantienen
   con el primer valor"— un item con tres procedures llega al cliente con uno solo.
3. ¿Hasta cuándo se acepta `teachingProcedureId` singular en el request? El front ya no lo
   manda.
4. El PDF separa las funciones con `;`. ¿Los teaching procedures van igual, o con coma? Hoy
   la tabla los muestra con coma en el tooltip.
5. El teaching method de la nota de sesión no se tocó: es un campo propio de la nota, no el
   del item, y el contrato no lo menciona. **Confirmar que sigue siendo uno solo.**

---

## B5 · Current medications denied

### Qué llegó

- `currentMedicationsDenied` (boolean, default `false`) y `currentMedicationsNote` (text
  nullable) en `POST`, `PUT` y `GET /assessments`.
- Con `denied: true`, `currentMedications` deja de ser requerido y el PDF imprime la nota en
  vez de la tabla, **aunque existan filas persistidas**.
- Nota vacía → el backend resuelve el texto estándar.
- El assessment automático del appointment 97151 arranca con `denied: true` si el cliente no
  tiene medicación activa.

### Cómo se adaptó el front

- La sección abre con la casilla; al marcarla aparece el campo de nota libre y debajo se
  explica qué se imprime si queda vacía, para que el proveedor lea el texto sin tener que
  escribirlo.
- **Las filas no se borran al marcar la casilla.** El contrato dice que el PDF las ignora,
  así que mandarlas no rompe nada, y borrarlas haría perder lo tipeado a quien marque la
  casilla por error. La tabla se oculta y se avisa cuántas filas siguen guardadas, para que
  quede claro que destildar las devuelve intactas.
- Con la casilla apagada la nota viaja en `null`: si no, un texto viejo quedaría colgado en
  el registro sin nada que lo imprima, y reaparecería si alguien vuelve a marcarla.
- La validación de "al menos una medicación" acepta la casilla como salida válida. Hoy no
  llega a dispararse —`showCurrentMedications` es obligatoria y `sectionBlocksSave` la exime
  desde la iteración del 2026-09-05— pero el mensaje ofrecía apagar la sección, salida que ya
  no existe.

### Preguntas abiertas

1. **El automático del 97151 puede quedar desactualizado.** Se crea con la foto de las
   medicaciones de ese momento. Si después se carga una medicación al expediente y nadie
   vuelve a abrir el assessment, el PDF imprime "el caregiver negó medicamentos" mientras el
   expediente dice lo contrario. ¿Se re-evalúa, o queda congelado? Si queda congelado —que es
   lo razonable para un documento clínico— habría que avisarlo en pantalla.
2. ¿La nota sólo aplica con `denied: true`? El pedido original decía *"también dar acceso
   para que puedan escribir algo"*, que puede leerse como una nota libre **con o sin** la
   casilla. Hoy está implementado como lo define el contrato: sólo con la casilla marcada.
   Si se quiere la otra lectura, el front es un cambio chico pero el PDF tendría que
   imprimirla.

---

## B1 · Environmental changes display

### Qué llegó

- El item guarda `environmentalChanges: { displayMode, showLegendBelow }`, con default
  `LINE` / `true` para registros nuevos **y existentes**.
- `displayMode` acepta `LINE`, `LIST_ONLY` y `LABEL`.
- Se lee en los dos GET y se escribe por un `PATCH …/{id}/environmental-changes` propio.

**Lo mejor del contrato:** que sea un endpoint aparte resuelve de raíz el riesgo que
teníamos —guardar el modo no puede pisar el resto de la configuración del item— y lo
independiza de la pregunta que sigue abierta desde el 2026-09-03 sobre qué hace el `PUT` con
las claves que no vienen.

### Cómo se adaptó el front

- Control nuevo al final del formulario del item: un select de modo y un switch para el
  listado. Se guarda con el resto del formulario, pero por su propio endpoint y sólo si
  cambió.
- El render salió a un módulo compartido
  (`datasheets/environmental-changes-display.tsx`): las cuatro gráficas hacían lo mismo con
  cuatro copias, y sumar tres modos a cada una habría dejado doce. Devuelve un array de
  `ReferenceLine` en vez de un componente porque **Recharts sólo reconoce a sus hijos
  directos**; envolverlos haría que no se dibujen. La posición la resuelve quien llama:
  `FrequencyChart` usa eje numérico y las otras tres categórico.
- El switch del listado queda **deshabilitado en `LIST_ONLY`**: sin líneas arriba, apagarlo
  dejaría los cambios sin ninguna representación. El proveedor eligió "sólo la lista", no
  "nada".
- Un item sin configurar se lee como el default, que es exactamente el comportamiento
  histórico: ninguna gráfica cambia sola.

### ⚠️ Falta `environmentalChangesLabel`

El contrato trae el modo pero **no la etiqueta corta por cambio**, que es la mitad del pedido
de Lidia: *"que ponga un label en la gráfica y que abajo explique el cambio — ejemplo: que
diga `MO` y abajo `motivating operations`"*. Ese `MO` lo escribe el proveedor y no hay dónde
guardarlo.

**Interino:** en modo `LABEL` los cambios se numeran en orden de fecha (`EC1`, `EC2`…) sobre
la gráfica y el listado de abajo los explica con el mismo número. Entrega **la forma pedida,
no el contenido pedido**.

**Cómo se cierra:** `environmentalChangeLabel()` en `lib/constants/environmental-changes.ts`
pasa a devolver el texto del proveedor. No hay nada más que tocar.

> ⚠️ La numeración es **por vista**: la gráfica numera sobre su rango visible y el listado
> sobre el suyo. Si los dos muestran el mismo período —el caso normal— coinciden. Es otra
> razón por la que el campo real importa.

### Preguntas abiertas

1. ¿El `PATCH` funciona sobre un item que todavía no tiene nivel configurado?
2. Al clonar el service plan de la compañía al del cliente, ¿el modo se hereda o cada item
   arranca en el default?
3. ¿La etiqueta corta, cuando llegue, la valida backend (largo máximo) o el front?

### Pendiente conocido del front

El panel de gráfica de la nota de sesión (`SessionItemChartPanel`) queda en el default:
trabaja sobre los items **de la nota**, no sobre los del service plan, y leer la config
costaría un request por item. No cambia respecto de hoy. Si se quiere que respete el modo
elegido, lo natural es que venga en el payload de la nota.
