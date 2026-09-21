# Pedidos pendientes de backend — 2026-09-21

Consolidado de tickets que requieren cambios de backend antes de poder implementarse
en el frontend.

---

## Ticket #8 — Tabla ABC dentro de cada Observation del Assessment

### Contexto

Actualmente cada observación del Assessment tiene:
- `date: string`
- `placesOfService: string[]`
- `summary: string` (texto libre)

El pedido es reemplazar `summary` por una **tabla de filas ABC** (Antecedent, Behavior,
Consequence) dentro de cada observación. El provider agrega filas con las 3 columnas.

### Cambio requerido

**Opción A:** Reemplazar summary por abcEntries

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
        }
      ]
    }
  ]
}
```

**Opción B:** Mantener summary + agregar abcEntries como campo adicional.

### Migración

Crear tabla `assessment_observation_abc_entry`:
- `id` UUID PK
- `assessment_observation_id` UUID FK
- `antecedent` TEXT
- `behavior` TEXT
- `consequence` TEXT
- `sort_order` INT

### Nota

Ya existe una sección "ABC Data" global (`abcData[]`). Este pedido es diferente:
quiere esa estructura **dentro de cada observación individual**.

---

## Ticket #13 — Campo Procedures en Service Plan (Data Collection)

### Contexto

En la configuración de Data Collection de cada item del Service Plan del cliente, se necesita
un campo de texto **"Procedures"** debajo de "Description" (topography).

Aplica a **todas las categorías excepto Maladaptive Behavior**.

### Cambio requerido

Agregar `procedures: string | null` a los endpoints de item data collection:

**GET `/client-service-plan-category/{id}/item`** — agregar en cada item:
```json
{
  "procedures": "Procedure text here"
}
```

**PUT item data collection** — aceptar:
```json
{
  "procedures": "Procedure text here"
}
```

**GET `/client-service-plan/client/{clientId}/assessment-data`** — incluir en cada item:
```json
{
  "categories": [
    {
      "items": [
        {
          "procedures": "Procedure text here"
        }
      ]
    }
  ]
}
```

### Migración

Agregar columna `procedures VARCHAR(MAX) NULL` a la tabla de item del client service plan.
Sin backfill necesario.

---

## Ticket #14 — Description y Procedures en Assessment (Categories & Items)

### Contexto

En el Assessment, para categorías que **no** sean Maladaptive Behavior:
- Reemplazar **"Preventive strategies"** por **"Description"** (read-only, desde SP `topography`)
- Reemplazar **"Consequence-Based Strategies"** por **"Procedures"** (desde SP)

Para Maladaptive Behavior, los campos Preventive y Consequence se mantienen como están.

### Dependencia

Depende del ticket #13. Necesita que `topography` y `procedures` viajen en el assessment-data.

### Cambio requerido

En **GET `/client-service-plan/client/{clientId}/assessment-data`**, cada item debe incluir:
```json
{
  "clientServicePlanCategoryItemId": "...",
  "topography": "Item description text",
  "procedures": "Procedure text"
}
```

Confirmar si estos campos son read-only en el assessment o editables (POST/PUT).

---

## Ticket #22 — Auditoría interna, login web y OTP por dispositivo

### 1. Auditoría interna

Se necesita un módulo/endpoint para consultar los logs de auditoría (quién hizo qué,
cuándo, desde dónde).

**Pendiente:** definir contrato del endpoint.

### 2. Botón de login en la página web

El botón de login en la landing page / página web pública aún no está.

**Pendiente:** confirmar si es landing page (otro repo) o front-office.

### 3. OTP cada 24 horas / dispositivo de confianza

El OTP se pide en cada login. Se necesita que si el usuario usa el **mismo dispositivo**,
el OTP se pida cada **24 horas** o se implemente **dispositivo de confianza**.

**Propuesta de endpoints:**

```http
POST /auth/verify-otp
{
  "otp": "123456",
  "trustDevice": true
}
→ { "accessToken": "...", "deviceToken": "uuid", "deviceTokenExpiresAt": "..." }
```

```http
POST /auth/login
{
  "email": "...",
  "password": "...",
  "deviceToken": "uuid"  // optional
}
→ { "accessToken": "...", "otpRequired": false }  // si token válido
→ { "otpRequired": true }                         // si no hay token o expiró
```

---

## Resumen

| Ticket | Descripción | Estado |
|--------|-------------|--------|
| #8 | Tabla ABC en Observations | Pendiente backend |
| #13 | Campo Procedures en SP | Pendiente backend |
| #14 | Description + Procedures en Assessment | Pendiente backend (depende de #13) |
| #22 | Auditoría, login web, OTP/dispositivo | Pendiente backend |
