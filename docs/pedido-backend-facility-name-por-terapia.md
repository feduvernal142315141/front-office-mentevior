# Facility Name por terapia en Other Services del Assessment

Fecha: 2026-09-16

## Contexto

La sección "Other Services" del Assessment tiene 4 terapias con un campo Yes/No cada una:
`speechTherapy`, `occupationalTherapy`, `physicalTherapy`, `feedingTherapy`.

Miriam pide que cada una tenga **su propio campo de texto** para registrar el nombre de la
agencia o facility donde el cliente recibe esa terapia.

Actualmente solo existe **un** campo de texto compartido: `otherServicesFacilityName`.

## Campos nuevos solicitados

| Campo actual (Yes/No) | Campo nuevo (texto) | Nombre sugerido |
|---|---|---|
| `otherServicesSpeechTherapy` | **nuevo** | `otherServicesSpeechTherapyFacilityName` |
| `otherServicesOccupationalTherapy` | **nuevo** | `otherServicesOccupationalTherapyFacilityName` |
| `otherServicesPhysicalTherapy` | **nuevo** | `otherServicesPhysicalTherapyFacilityName` |
| `otherServicesFeedingTherapy` | **nuevo** | `otherServicesFeedingTherapyFacilityName` |

El campo existente `otherServicesFacilityName` se conserva para la fila "Other".

## Endpoints afectados

### POST `/assessments`

Agregar 4 campos opcionales al body:

```json
{
  "otherServicesSpeechTherapyFacilityName": "HappySpeech LLC",
  "otherServicesOccupationalTherapyFacilityName": "OT Center",
  "otherServicesPhysicalTherapyFacilityName": null,
  "otherServicesFeedingTherapyFacilityName": null
}
```

### PUT `/assessments/{id}`

Mismos 4 campos opcionales.

### GET `/assessments/{id}`

Devolver los 4 campos nuevos en la respuesta:

```json
{
  "otherServicesSpeechTherapyFacilityName": "HappySpeech LLC",
  "otherServicesOccupationalTherapyFacilityName": "OT Center",
  "otherServicesPhysicalTherapyFacilityName": null,
  "otherServicesFeedingTherapyFacilityName": null,
  "otherServicesFacilityName": "Other facility"
}
```

### GET `/client-service-plan/assessment-data/{clientId}`

Si aplica, devolver los campos vacíos en el draft:

```json
{
  "otherServicesSpeechTherapyFacilityName": "",
  "otherServicesOccupationalTherapyFacilityName": "",
  "otherServicesPhysicalTherapyFacilityName": "",
  "otherServicesFeedingTherapyFacilityName": ""
}
```

## Validaciones

- Tipo: `string | null`.
- No son requeridos (a diferencia de `previousAgencyName` que sí lo es cuando
  `showOtherServices = true`).
- Longitud máxima sugerida: 255 caracteres (igual que `otherServicesFacilityName`).
- Si la terapia correspondiente es `false` (No), el campo se ignora al guardar
  o se guarda como `null`.

## Migración

Agregar 4 columnas `VARCHAR(255) NULL` a la tabla `assessment`:

```sql
ALTER TABLE assessment
  ADD COLUMN other_services_speech_therapy_facility_name VARCHAR(255) NULL,
  ADD COLUMN other_services_occupational_therapy_facility_name VARCHAR(255) NULL,
  ADD COLUMN other_services_physical_therapy_facility_name VARCHAR(255) NULL,
  ADD COLUMN other_services_feeding_therapy_facility_name VARCHAR(255) NULL;
```

No requiere backfill: los assessments existentes tendrán `NULL` en estos campos.

## Compatibilidad

- Cambio aditivo: no rompe contratos existentes.
- `otherServicesFacilityName` se conserva intacto para la fila "Other".
- El frontend ya tiene el layout preparado con los campos disabled; al entregar
  este cambio solo se conectan.

## PDF

Si los campos tienen valor, incluirlos en el PDF de Assessment debajo de cada
terapia correspondiente, o como una columna adicional en la tabla de Other Services.
Criterio del backend.
