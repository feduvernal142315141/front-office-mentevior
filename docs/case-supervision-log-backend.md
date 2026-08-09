# Case Supervision Log — Análisis del contrato y preguntas

> Fecha: 2026-08-08
> Contrato analizado: *Case Supervision Log - API Contract*, 2026-08-07
> Estado del front: **implementado** (2026-08-08). Plan en `plans/case-supervision-log.md`.

## 0. Resumen

Se abrieron **ocho puntos**. Backend respondió tres el 2026-08-08. De los que quedan, el
§1 es el único que produce **números incorrectos sin que nada falle** —no hay error, no
hay excepción, el reporte simplemente muestra un valor equivocado—.

| # | Tema | Estado |
| --- | --- | --- |
| 1 | `duration` cae a `Appointment.units` | 🔴 **Abierto** — riesgo de horas 4× infladas |
| 2 | `monthYear` en `MMyyyy` para rangos | ✅ Backend transforma a fecha antes de comparar |
| 3 | El listado no trae las horas | ✅ Se queda así por ahora — front ajustado |
| 4 | `supervisionHours` no filtra por billing code | 🟠 Abierto |
| 5 | Sin `PUT`; ¿duplicados? ¿`DELETE`? | 🟠 `PUT` confirmado que no existe; `DELETE` sin definir |
| 6 | El permiso `supervision` ya está en uso | 🟡 Abierto |
| 7 | Prefijo de tipo en los filtros | 🟡 Abierto |
| 8 | `Case Supervision Modality` vacía | 🟡 Abierto |

El front ya está construido contra este contrato. Lo abierto no lo bloquea, pero el §1
puede hacer que muestre horas equivocadas sin que nadie lo note.

---

## 1. 🔴 `duration` cae a `Appointment.units`, y una unidad no es una hora

### Qué dice el contrato

> `duration` se calcula con `timeEnd - timeStart`, expresado en horas con dos decimales.
> Si faltan las horas, se usa `Appointment.units`; si tampoco existe, se devuelve `0`.

### Por qué es un problema

En este sistema **1 unidad = 15 minutos**. No es una interpretación nuestra, está fijado
en el front en dos lugares:

- `lib/utils/unit-calculation.ts:5` → *"Each billable unit = 15 minutes"*
- `lib/utils/prior-auth-utils.ts:72` → *"1 unit = 15 min → 4 units = 1 hour"*

Si `units` se usa crudo donde se espera un número de horas, un appointment de **4
unidades (1 hora real)** se contabiliza como **4 horas**.

El error no queda contenido en esa fila: `duration` alimenta `supervisionHours` y
`totalsHours`, que alimentan el porcentaje, que decide **Met / Unmet**. Un reporte puede
pasar de `Unmet` a `Met` sólo porque a unos appointments les faltaba la hora de inicio.

### Pregunta

¿Se está dividiendo `units / 4` para convertir a horas? Si no, hay que corregirlo.

Y una segunda, sobre el `0` final: si un appointment no tiene ni horas ni unidades,
devolver `0` lo hace **invisible** en el total. ¿Preferimos que sea `0` en silencio, o
que el reporte pueda señalar que hay appointments sin duración calculable?

---

## 2. ✅ `monthYear` en formato `MMyyyy` — resuelto 2026-08-08

**Respuesta de backend:** las fechas se transforman antes de comparar, así que los
operadores de rango funcionan correctamente.

Queda anotado abajo el análisis original porque **la dependencia sigue viva**: los rangos
funcionan por esa transformación, no porque el formato lo permita. Si en algún refactor se
comparara el valor crudo, los rangos que cruzan un cambio de año devolverían de menos sin
fallar, y ni el front ni el usuario lo notarían.

<details>
<summary>Análisis original</summary>

### Qué dice el contrato

> `monthYear` es un alias en formato `MMyyyy` sobre el campo persistido `date`.
> `monthYear` soporta `EQ`, `GT`, `GTE`, `LT` y `LTE`.

### Por qué es un problema

En `MMyyyy` el mes va **antes** que el año, así que el valor no crece con el tiempo:

| Mes | `MMyyyy` | Como número | Como texto |
| --- | --- | --- | --- |
| Agosto 2026 | `082026` | 82.026 | `"082026"` |
| Enero 2027 | `012027` | 12.027 | `"012027"` |

Enero 2027 es **posterior** a agosto 2026, pero tanto numérica como
lexicográficamente queda **antes**. Un filtro `monthYear__GTE__082026__AND` —el caso de
uso natural, "reportes de agosto en adelante"— dejaría fuera todo 2027.

Lo peligroso es que **no falla**: devuelve menos filas. El front no tiene forma de
detectarlo, y el usuario ve una lista incompleta que parece correcta.

`EQ` sí funciona bien en cualquier caso. El problema es exclusivo de los cuatro
operadores de rango.

### Pregunta

¿El backend parsea `MMyyyy` a fecha antes de comparar, o compara el valor crudo?

### Sugerencia

Aceptar también **`yyyyMM`** (`202608`), que sí ordena y compara solo, y que es el
formato que ya usa Monthly Supervision para lo mismo. Tener dos reportes hermanos con el
mes al revés uno del otro es una fuente de bugs por sí sola.

Si se mantiene `MMyyyy`, alcanza con confirmar que la comparación se hace sobre `date`
ya parseado — pero conviene dejarlo escrito en el contrato, porque leyéndolo hoy no se
puede saber.

</details>

---

## 3. ✅ El listado no devuelve las horas — cerrado 2026-08-08

**Respuesta de backend:** por ahora el listado devuelve sólo lo que ya trae; no se
agregan las horas.

**Qué hizo el front:** se **quitaron las columnas** de "Supervision / Total" y
"Requirement" de la tabla. Sin el dato mostrarían un guion en todas las filas siempre, y
una columna permanentemente vacía se lee como "falta cargar esto" — el mismo criterio que
se aplicó a la columna Modality del PDF (§8).

El porcentaje y el Met/Unmet quedan donde el dato sí existe: **la pantalla de creación, el
detalle y el PDF**. Los campos siguen tipados como opcionales y el servicio ya los lee, así
que si backend los agrega más adelante sólo hay que volver a poner las columnas.

<details>
<summary>Análisis original — por si se reconsidera</summary>

### Qué dice el contrato

`GET /reports/case-supervision-log` devuelve por cada fila:

```json
{ "id", "clientId", "clientName", "providerId", "providerName", "monthYear" }
```

### Por qué es un problema

Falta `totalsHours` y `supervisionHours`. Sin ellos **el listado no puede mostrar el
porcentaje de supervisión ni el Met/Unmet**, que es exactamente lo que alguien va a
buscar cuando abre una lista de estos reportes: cuáles cumplen y cuáles no.

La única alternativa desde el front es pedir el detalle de cada fila — una request por
registro para pintar una tabla de 10. No es viable.

Monthly Supervision ya devuelve `supervisedHours` y `totalHoursWorked` en su listado, y
la tabla los usa.

### Pedido

Agregar `totalsHours` y `supervisionHours` a las entidades del listado. Con eso el
porcentaje y el Met/Unmet se calculan en el front sin requests extra.

</details>

---

## 4. 🟠 ¿`supervisionHours` es realmente de supervisión?

### Qué dice el contrato

> `supervisionHours` suma únicamente los appointments cuyo `Appointment.providerId`
> coincide con `providerId`.

No hay filtro por billing code.

### Por qué es un problema

Si ese provider también atendió al cliente en sesiones directas —un 97153, por ejemplo—
esas horas entran en `supervisionHours` y **inflan el porcentaje de supervisión**. El
reporte podría dar `Met` sin que haya habido supervisión suficiente.

El criterio actual mide *"horas de este provider con este cliente"*, que no es lo mismo
que *"horas de supervisión"*. En Monthly Supervision el conjunto sí está acotado a los
appointments 97155.

### Pregunta

¿Debería filtrarse por los códigos de supervisión, o el criterio "todo lo del provider"
es deliberado?

Si es deliberado, vale la pena renombrar el campo en el contrato para que no prometa lo
que no mide.

---

## 5. 🟠 Sin `PUT`: ¿qué pasa con los duplicados y los errores?

### Estado — 2026-08-08

- **`PUT`:** confirmado que no existe. El reporte es inmutable.
- **`DELETE`:** **sin definir.** No se ha hablado del tema, así que hoy no hay forma de
  quitar un reporte creado por error.
- **Duplicados:** sigue sin respuesta.

### Qué dice el contrato

> No existe endpoint de actualización para `CaseSupervisionLog`.

Tampoco hay endpoint de borrado.

### Por qué importa

Es una decisión legítima —un reporte emitido puede ser inmutable a propósito— pero tiene
dos consecuencias que el front necesita saber manejar:

**a) Duplicados.** Si el analista crea dos veces el mismo `(clientId, providerId, mes)`:
¿el backend rechaza con un error, sobrescribe, o quedan dos reportes conviviendo?

**b) Corrección.** Sin update ni delete, un reporte creado por error queda para siempre.

### Preguntas

1. ¿Se rechaza el duplicado? Si sí, ¿con qué código y qué mensaje, para poder mostrarlo
   bien?
2. ¿Está previsto un `DELETE` más adelante?

### Qué hace el front (ya implementado)

Antes de crear consulta el listado filtrando por cliente + provider + mes. Si ya existe
uno, avisa y ofrece **abrir el existente** en vez de crear otro. Es un rodeo que
desaparece solo el día que el backend valide el duplicado.

Y siempre pide **confirmación explícita** antes de persistir, nombrando cliente,
supervisor, mes y el resultado de cumplimiento. No es fricción gratuita: sin `PUT` ni
`DELETE`, esa confirmación es la única barrera que existe contra una acción irreversible.

---

## 6. 🟡 El permiso `supervision` ya está en uso para otra cosa

### Qué dice el contrato

> Permiso: módulo `supervision`, acción `READ` / `CREATE`.

### Por qué es un problema

`supervision` ya existe en el sistema y hoy protege **el catálogo de eventos de
supervisión** en `/my-company/events/supervision` — una pantalla de *configuración de la
compañía*, sin relación con este reporte clínico.

Está mapeado así en `lib/utils/permissions-new.ts:38`,
`lib/hooks/use-filtered-nav-items.ts:36` y `components/layout/ProtectedRoute.tsx:30`.

Compartir el módulo significa que:

- Quien pueda **configurar** el catálogo de supervisión podrá **crear reportes clínicos**
- Quien deba crear reportes tendrá acceso a **configuración de la compañía**

Son dos permisos distintos gobernados por un solo interruptor. Nadie puede tener uno sin
el otro.

Como referencia, Monthly Supervision —que es el reporte hermano— tiene su propio módulo:
`monthly_supervisions`.

### Pregunta

¿Es intencional, o corresponde un módulo propio (`case_supervision_log`)?

---

## 7. 🟡 ¿Qué prefijo de tipo llevan los valores de filtro?

### Contexto

El front construye los filtros con un helper (`lib/utils/query-filters.ts`) que **tipa el
valor** según el campo:

| Tipo | Se manda como |
| --- | --- |
| UUID | `UUID_00000000-...` |
| Entero | `Integer_202608` |
| Fecha | `Date_2026-08-01` |
| Booleano | `Boolean_true` |
| Texto | valor pelado |

El ejemplo del contrato va sin prefijo: `monthYear__EQ__082026__AND`.

### Pregunta

Confirmar, campo por campo, qué espera el backend:

- `monthYear` → ¿String pelado, o `Integer_082026`?
- `clientId` / `providerId` → ¿`UUID_...`? (es lo que usa Monthly Supervision)
- `date` → ¿`Date_2026-08-01`?
- `active` → ¿`Boolean_true`?

Un prefijo de más o de menos no da error de validación: simplemente **no matchea nada** y
la lista vuelve vacía.

---

## 8. 🟡 `Case Supervision Modality` queda vacía

### Qué dice el contrato

> La columna `Case Supervision Modality` permanece vacía porque no existe esa propiedad
> en `CaseSupervisionLogAppointment`.

### Pregunta

¿Está previsto agregarla, o la plantilla se va a quedar con la columna en blanco?

### Qué hace el front mientras tanto

En pantalla **no vamos a mostrar la columna**. Una columna permanentemente vacía se lee
como "esto falta cargarlo", que confunde más que no tenerla. Si el campo llega después,
se agrega.

Vale la pena revisar si conviene sacarla también del PDF por el mismo motivo — un
documento que se le entrega a un pagador con una columna en blanco invita a preguntas.

---

## 9. Lo que el front asume mientras tanto

Para que no haya sorpresas al integrar:

| Tema | Supuesto |
| --- | --- |
| Porcentaje de cumplimiento | Se calcula en pantalla con la misma fórmula del PDF: `supervisionHours * 100 / totalsHours`, `Met` si ≥ 10%, protegiendo la división por cero cuando `totalsHours` es `0` |
| `characteristic` | Trae saltos de línea reales (`\n`) y se renderiza respetándolos |
| `timeStart` / `timeEnd` | Llegan `HH:mm:ss` y se muestran en formato de 12 horas |
| Respuesta del `POST` | UUID pelado como string; se acepta también envuelto en `{ id }` |
| Después de crear | Se relee con `GET /{id}` en vez de asumir que lo guardado es igual a lo que se vio, porque el `POST` recalcula todo desde cero |
| PDF | Mismo patrón que Monthly Supervision: id en el path, respuesta `{ fileBase64 }` |

---

## 10. Qué queda pendiente — actualizado 2026-08-08

**Bloqueante para confiar en los números:**

- [ ] **§1 · `duration` con `units`.** Es el único que sigue produciendo un valor
      incorrecto de forma silenciosa. Si `units` se usa crudo como horas, el dato sale 4×
      inflado y arrastra el porcentaje y el Met/Unmet.

**Importante antes de dar la HU por cerrada:**

- [ ] **§4 · ¿`supervisionHours` filtra por billing code?** Si incluye sesiones directas
      del provider, infla el porcentaje.
- [ ] **§5 · Duplicados y `DELETE`.** El `PUT` ya se confirmó inexistente. Falta saber si
      el duplicado se rechaza y si habrá borrado.

**Cuando se pueda:**

- [ ] **§6 · Permiso propio** en vez de compartir `supervision` con el catálogo de eventos
- [ ] **§7 · Prefijo de tipo en los filtros** — un prefijo de más o de menos devuelve la
      lista vacía sin error
- [ ] **§8 · `Case Supervision Modality`** — ¿se agrega el campo o se saca la columna del PDF?

**Ya cerrados:** §2 (fechas transformadas antes de comparar) y §3 (el listado se queda sin
horas; el front quitó las columnas).
