# Ticket #8 — Tabla ABC dentro de cada Observation del Assessment

Fecha: 2026-09-21

## Contexto

Actualmente cada observación del Assessment tiene:
- `date: string`
- `placesOfService: string[]`
- `summary: string` (texto libre)

El pedido es reemplazar `summary` por una **tabla de filas ABC** (Antecedent, Behavior,
Consequence) dentro de cada observación. El provider agrega filas con las 3 columnas.

## Cambio requerido en backend

### Opción A: Reemplazar summary por abcEntries

En `observations[]` de POST/PUT/GET `/assessments`:

```json
{
  "observations": [
    {
      "date": "2026-09-21",
      "placesOfService": ["uuid-1"],
      "abcEntries": [
        {
          "antecedent": "Staff/Parents ask Joe to stop playing on the computer.",
          "behavior": "Joe screams 'NO!' and refuses to leave the computer.",
          "consequence": "Staff/Parents tell Joe to leave the computer again."
        },
        {
          "antecedent": "Staff/Parents tell Joe to leave the computer.",
          "behavior": "Joe again refuses to leave.",
          "consequence": "Staff/Parents start counting to 10 as a warning."
        }
      ]
    }
  ]
}
```

### Opción B: Mantener summary + agregar abcEntries

Conservar `summary` para backward compat y agregar `abcEntries` como campo adicional.
El PDF renderiza la tabla ABC si tiene filas, o el summary si no.

## Migración

Crear tabla `assessment_observation_abc_entry` con:
- `id` UUID PK
- `assessment_observation_id` UUID FK
- `antecedent` TEXT
- `behavior` TEXT
- `consequence` TEXT
- `sort_order` INT

## Nota

Ya existe una sección "ABC Data" global en el Assessment (`abcData[]` con `antecedent`,
`behavior`, `consequence`). Este pedido es diferente: quiere esa misma estructura **dentro
de cada observación individual**, no en la sección global.

## Estado

**Pendiente backend.**
