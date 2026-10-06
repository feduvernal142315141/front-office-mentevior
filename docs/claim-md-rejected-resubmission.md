# Reenvío de claims rechazados

En Billing → Billed Claims → detalle del batch, los usuarios con permiso de edición pueden seleccionar de 1 a 100 claims vigentes en estado `REJECTED` y elegir **Resend selected**. Antes deben consultar **View detail** y corregir los datos indicados por el rechazo.

La confirmación llama a `POST /claim-submissions/resubmit` con `{ batchClaimId, submissionIds }`. El backend valida conjuntamente estado, pertenencia al batch y permisos. Regenera el 837P de los seleccionados con los datos actuales, conserva el batch y devuelve nuevos intentos. Los demás claims no se reenvían.

La pantalla bloquea envíos duplicados durante la petición y refresca los estados al finalizar. Los intentos reemplazados no son seleccionables. El detalle y la verificación usan `submissionId` para identificar el intento exacto.

Validación local: `node --test tests/claim-md-resubmission.test.cjs` y `node_modules/.bin/tsc --noEmit --incremental false`.
