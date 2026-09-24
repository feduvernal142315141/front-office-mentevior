# Ticket #31 — Proposed Schedule con rango de hora por día

Fecha: 2026-09-24

## Resumen

En la sección "Proposed Schedule" del Assessment, cada día de la semana debe permitir
ingresar un **rango de hora** (ej. "2PM-4PM") en vez de un número de horas.

## Cambio requerido

### POST/PUT `/assessments`

`proposedSchedule[].schedule` actualmente es un JSON con valores numéricos:

```json
{
  "schedule": "{\"Monday\":2,\"Tuesday\":2,\"Wednesday\":2,\"Thursday\":2,\"Friday\":2,\"Saturday\":0,\"Sunday\":0}"
}
```

Debe aceptar **strings** con rangos de hora:

```json
{
  "schedule": "{\"Monday\":\"2PM-4PM\",\"Tuesday\":\"2PM-4PM\",\"Wednesday\":\"2PM-4PM\",\"Thursday\":\"2PM-4PM\",\"Friday\":\"2PM-4PM\",\"Saturday\":\"\",\"Sunday\":\"\"}"
}
```

### GET `/assessments/{assessmentId}`

Devolver los valores como strings.

## Opción alternativa

Si cambiar el tipo de `number` a `string` rompe compatibilidad, agregar un campo
separado `scheduleTimeRanges` con la misma estructura pero valores string, y deprecar
el campo numérico.

## PDF

El PDF debe mostrar los rangos de hora en vez de números. Ej: "Mon: 2PM-4PM" en vez
de "Mon: 2 hours".

## Frontend (cuando backend esté listo)

- Cambiar inputs numéricos por inputs de texto libre o dos time pickers (entrada/salida) por día
- El "Total h/week" se calcula parseando los rangos (diferencia entre hora fin y hora inicio)
- El botón "Apply Mon–Fri" copia el rango del lunes a martes-viernes
