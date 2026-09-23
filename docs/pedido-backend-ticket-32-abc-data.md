# Ticket #32 — Eliminar Observations, absorber Date+POS en ABC Data

Fecha: 2026-09-22

## Resumen

Eliminar la sección `observations` del Assessment y mover sus campos (`date`,
`placesOfService`) a `abcData`. La sección ABC Data absorbe todo.

## Cambio en `abcData[]`

### POST `/assessments` y PUT `/assessments/{id}`

Cada fila de `abcData` ahora incluye `date` y `placesOfService`:

```json
{
  "abcData": [
    {
      "date": "2026-09-22",
      "placesOfService": [
        "cead2b2c-92af-4a5f-a43b-17e332724df2"
      ],
      "antecedent": "The preferred toy was removed and a worksheet was placed on the table.",
      "behavior": "The client pushed the worksheet, yelled 'No,' and dropped from the chair.",
      "consequence": "The worksheet was removed, a break was provided."
    }
  ]
}
```

### GET `/assessments/{assessmentId}`

Misma estructura en la respuesta:

```json
{
  "abcData": [
    {
      "date": "2026-09-22",
      "placesOfService": [
        "cead2b2c-92af-4a5f-a43b-17e332724df2"
      ],
      "antecedent": "...",
      "behavior": "...",
      "consequence": "..."
    }
  ]
}
```

## Campos nuevos en `abcData[]`

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `date` | `string` (yyyy-MM-dd) | Sí | Fecha de la observación |
| `placesOfService` | `UUID[]` | No | IDs del catálogo Place of Service |

Los campos existentes (`antecedent`, `behavior`, `consequence`) no cambian.

## Eliminar `observations`

- `observations` ya no se envía en POST/PUT.
- En GET, devolver `"observations": []` o no incluir el campo.
- El frontend dejará de renderizar la sección Observations.

## Migración

- Agregar columnas `date DATE NULL` y tabla puente `assessment_abc_data_place_of_service`
  a `assessment_abc_data`.
- Opcionalmente migrar datos existentes de `assessment_observation` → `assessment_abc_data`
  (cada observación con sus `abcEntries` se convierte en filas de `abcData` con su `date`
  y `placesOfService`).
- Si no se migran, los datos quedan en la tabla vieja como historial.

## PDF

La sección de observaciones en el PDF se reemplaza por la tabla ABC Data con columnas:
Date | POS | Antecedent | Behavior | Consequence
