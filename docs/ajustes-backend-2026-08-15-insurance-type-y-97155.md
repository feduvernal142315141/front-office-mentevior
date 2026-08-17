# Ajustes de backend 2026-08-15 — Insurance `type` (CMS-1500) y 97155 sub-event

> Fecha: 2026-08-17
> Origen: dos contratos que pasó backend el 2026-08-15.
> Estado del front: ✅ **implementado** (los dos).

---

## 1. `ClientInsurance.type` para el checkbox de seguro del CMS-1500

### Contrato

`ClientInsurance` guarda un enum `type` que el generador de CMS-1500 usa para marcar
el checkbox del Item 1, independiente de `PayerPlan.planType`:

| Valor | CMS-1500 Item 1 |
|---|---|
| `COMERCIAL` | Group Health Plan |
| `MEDICAID` | Medicaid |

- `POST /insurances` y `PUT /insurances`: `type` es **requerido**.
- `GET /insurances/{id}` y `GET /insurances/by-client-id/{clientId}`: devuelven `type`.
- Filas existentes con `type = null` mantienen el fallback anterior por
  `PayerPlan.planType`. El mapeo 837P `SBR09` sigue basado en `PayerPlan.planType.code`.

> Ojo: el valor del enum es `COMERCIAL` (con una sola "m", en español), no `COMMERCIAL`.

### Qué se hizo en el front

| Archivo | Cambio |
|---|---|
| `lib/types/client-insurance.types.ts` | `ClientInsuranceType = "COMERCIAL" \| "MEDICAID"`; `type: ClientInsuranceType \| null` en `ClientInsurance`; requerido en ambos DTOs |
| `lib/modules/client-insurances/services/client-insurances-api.service.ts` | `normalizeInsuranceType()`: cualquier valor inesperado → `null` |
| `lib/schemas/client-insurance-form.schema.ts` | `INSURANCE_TYPE_OPTIONS` (labels "Commercial (Group Health Plan)" / "Medicaid") + campo `type` requerido en el schema zod |
| `StepInsurances.tsx` | Select "Insurance type" junto al Payer en el modal; se envía en create y update; columna "Type" en la tabla (la columna Primary/Secondary se renombró a "Priority"); filas viejas sin type muestran "—" |

Al **editar** una insurance vieja (`type = null`) el select arranca vacío y obliga a
elegir un valor antes de guardar — el `PUT` lo exige, así que no hay forma de "conservar
el null" desde el front.

---

## 2. 97155 — `activeDirectionActivitiesShow` derivado del `AppointmentSubEvent`

### Contrato

`GET /appointment/{appointmentId}/note/97155` · `PUT /appointment/note/97155`

- El GET devuelve `activeDirectionActivitiesShow: true` sii el appointment CPT 97155
  tiene un `AppointmentSubEvent` activo y no eliminado.
- El PUT **valida** ese mismo estado: responde `422` si el payload manda `false`
  habiendo sub-event, o `true` sin haberlo. Al persistir, el backend guarda el valor
  derivado, no el del payload.

### Qué se hizo en el front

- `useSessionNote97155Form.ts` (`handleSubmit`): la validación condicional de la
  sección y el payload usan **siempre** `note.activeDirectionActivitiesShow` (lo que
  devolvió el GET), nunca un valor editable del form. También se eliminó el prefill
  del técnico al encender el switch (ya no se puede encender; el prefill al cargar la
  nota en `noteToFormData` sigue vivo).
- `SessionNote97155Form.tsx`: el switch "Active direction" quedó **deshabilitado** como
  indicador de solo lectura, con descripción que aclara que se setea automáticamente
  desde el sub-event de supervisión. La sección (técnico, actividades, narrative) se
  muestra u oculta según ese valor derivado.
- `lib/types/appointment-note-97155.types.ts`: el campo quedó documentado como derivado
  en el response y el payload.

**Consecuencia UX:** si el appointment tiene sub-event, la sección Active Direction es
obligatoria (técnico + ≥1 actividad + narrative) y no se puede apagar; si no lo tiene,
la sección no aparece. Para cambiarlo hay que agregar/quitar el sub-event en el
calendario, no en la nota.
