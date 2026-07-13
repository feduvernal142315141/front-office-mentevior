# Billing Codes por Rol — Requerimientos Backend

## Objetivo

Permitir que cada compañía configure qué Billing Codes están disponibles para cada rol (RBT, BCaBA, BCBA, etc.), de manera que al crear un appointment, el provider solo vea los billing codes autorizados para su rol.

---

## Contexto actual

### Modelo de datos existente

**Rol (`/roles`):**
```json
{
  "id": "uuid",
  "roleName": "RBT",
  "permissions": [{ "permissionId": "uuid", "actionsValue": 7 }],
  "professionalInformation": true,
  "credentialsSignature": false,
  "isActive": true
}
```
> No tiene campo de billing codes.

**Billing Code (ya existe en el sistema):**
```json
{
  "id": "uuid",
  "type": "CPT",
  "code": "97153",
  "modifier": "XP",
  "description": "Adaptive Behavior Treatment by Protocol"
}
```

**Flujo actual al crear appointment:**
```
User selecciona Event Type + Cliente
  → GET /prior-authorizations/approved-billing-codes/by-client/{clientId}?billingCodeType=Session
  → Retorna TODOS los billing codes aprobados del cliente (sin filtrar por rol)
```

---

## Cambios requeridos

### 1. Agregar `billingCodes[]` al modelo de Rol

La relación es **1 Rol → N Billing Codes**. Los billing codes asignables deben ser los que la compañía ya tiene configurados.

#### `GET /roles/{roleId}` — Cambio en response

Agregar campo `billingCodes` al response:

```json
{
  "id": "uuid",
  "roleName": "RBT",
  "permissions": [...],
  "professionalInformation": true,
  "credentialsSignature": false,
  "isActive": true,
  "billingCodes": [
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97153",
      "modifier": null
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97152",
      "modifier": null
    }
  ]
}
```

#### `GET /roles?page=0&pageSize=100` — Cambio en response

Incluir `billingCodes[]` en cada entidad del listado (mismo formato que arriba).

#### `POST /roles` — Cambio en request

Agregar `billingCodeIds[]` al payload de creación:

```json
{
  "roleName": "RBT",
  "permissions": [...],
  "professionalInformation": true,
  "credentialsSignature": false,
  "billingCodeIds": ["uuid-1", "uuid-2"]
}
```

> Se envían solo los IDs. El backend resuelve la relación.

**Response `201`:** Mismo formato que el GET con `billingCodes[]` poblado.

#### `PUT /roles` — Cambio en request

Agregar `billingCodeIds[]` (reemplaza la lista completa, mismo comportamiento que `billingCodes` en categorías):

```json
{
  "id": "uuid",
  "roleName": "RBT",
  "permissions": [...],
  "professionalInformation": true,
  "credentialsSignature": false,
  "billingCodeIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

> Si se envía `[]` vacío, el rol no tendrá restricciones de billing codes (ve todos). Si se envía `null` o se omite, no se modifica la configuración actual.

---

### 2. Endpoint para obtener billing codes disponibles de la compañía

Este endpoint ya existe parcialmente. Se necesita un listado de billing codes configurados a nivel de compañía para que el admin pueda seleccionar cuáles asignar a cada rol.

#### `GET /billing-code/catalog` (o endpoint equivalente existente)

**Response `200`:**
```json
{
  "entities": [
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97151",
      "modifier": null,
      "description": "Behavior Identification Assessment"
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97151",
      "modifier": "TS",
      "description": "97151 con modificador TS"
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97152",
      "modifier": null,
      "description": "Behavior Identification Supporting Assessment"
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97153",
      "modifier": null,
      "description": "Adaptive Behavior Treatment by Protocol"
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97153",
      "modifier": "XP",
      "description": "97153 bajo supervisión concurrente"
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97155",
      "modifier": null,
      "description": "Adaptive Behavior Treatment with Protocol Modification"
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97155",
      "modifier": "HN",
      "description": "97155 con modificador HN (BCaBA)"
    },
    {
      "id": "uuid",
      "type": "CPT",
      "code": "97155",
      "modifier": "XP",
      "description": "97155 bajo supervisión concurrente"
    }
  ]
}
```

> Si este endpoint ya existe, solo confirmar el path. El frontend lo usará para poblar el multi-select en la configuración del rol.

---

### 3. Filtrado de billing codes al crear appointment

Esta es la pieza clave. Al obtener los billing codes aprobados para un appointment, se deben filtrar por los billing codes del rol del provider.

#### Opción A (recomendada): Filtrado server-side

Modificar el endpoint existente para aceptar `providerId`:

**`GET /prior-authorizations/approved-billing-codes/by-client/{clientId}`**

**Query params existentes:** `billingCodeType`

**Query param nuevo:** `providerId` (opcional)

```
GET /prior-authorizations/approved-billing-codes/by-client/{clientId}
    ?billingCodeType=Session
    &providerId=uuid-del-provider
```

**Lógica:**
1. Obtener billing codes aprobados del cliente (como hoy)
2. Si `providerId` está presente:
   - Obtener el `roleId` del provider
   - Obtener los `billingCodes` configurados para ese rol
   - Si el rol tiene billing codes configurados (lista no vacía): retornar la **intersección** de billing codes aprobados del cliente ∩ billing codes del rol
   - Si el rol no tiene billing codes configurados (lista vacía): retornar todos (sin filtrar, para backward compatibility)
3. Si `providerId` no está presente: retornar todos (comportamiento actual)

**Response:** Mismo formato actual, solo cambian los billing codes retornados.

```json
{
  "id": "uuid",
  "authNumber": "AUTH-001",
  "billingCodes": [
    {
      "id": "uuid",
      "name": "97153",
      "modifier": "",
      "type": "CPT",
      "availableUnit": 120
    }
  ]
}
```

#### Opción B (alternativa): Filtrado client-side

Si se prefiere no modificar el endpoint existente, el frontend puede hacer la intersección. En ese caso se necesita:

**`GET /roles/{roleId}/billing-codes`** (nuevo endpoint)

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "type": "CPT",
    "code": "97153",
    "modifier": null
  }
]
```

> El frontend haría la intersección entre los billing codes del cliente y los del rol.

---

### 4. Validación en creación/actualización de appointment

#### `POST /appointment` y `PUT /appointment`

Agregar validación server-side:

1. Resolver el `roleId` del `providerId` enviado
2. Obtener los billing codes configurados para ese rol
3. Si el rol tiene billing codes configurados y el `billingCodeId` enviado **no está** en esa lista → retornar error `400`:

```json
{
  "statusCode": 400,
  "message": "The billing code is not authorized for the provider's role"
}
```

> Esta validación es un safety net. El frontend ya filtrará, pero el backend debe validar para evitar bypass.

---

## Resumen de endpoints

| Método | Endpoint | Cambio |
|--------|----------|--------|
| `GET` | `/roles/{roleId}` | Response agrega `billingCodes[]` |
| `GET` | `/roles?page&pageSize` | Response agrega `billingCodes[]` por entidad |
| `POST` | `/roles` | Request agrega `billingCodeIds[]` |
| `PUT` | `/roles` | Request agrega `billingCodeIds[]` |
| `GET` | `/billing-code/catalog` | Confirmar existencia (catálogo de billing codes de la compañía) |
| `GET` | `/prior-authorizations/approved-billing-codes/by-client/{clientId}` | Nuevo query param `providerId` para filtrar por rol |
| `POST` | `/appointment` | Validación: billing code autorizado para el rol del provider |
| `PUT` | `/appointment` | Validación: billing code autorizado para el rol del provider |

## Modelo de relación

```
Company
  └── BillingCode (catálogo de la compañía)
        ├── id, type, code, modifier, description
        └── (N:M con Role)

Role
  ├── id, roleName, permissions[], professionalInformation, credentialsSignature
  └── billingCodes[] ← NUEVO (IDs de billing codes permitidos)

MemberUser (Provider)
  ├── id, firstName, lastName, email, roleId
  └── role → Role → billingCodes[] (hereda restricciones)

Appointment
  ├── providerId → MemberUser → Role → billingCodes[]
  ├── billingCodeId ← debe estar en billingCodes[] del rol
  └── (validación server-side)
```

## Tabla de referencia (ejemplo de configuración)

| Billing Code | Descripción | RBT | BCaBA | BCBA |
|---|---|---|---|---|
| 97151 | Behavior Identification Assessment | - | Si | Si |
| 97151 TS | 97151 con modificador TS | - | Si | Si |
| 97152 | Behavior Identification Supporting Assessment | Si | Si | Si |
| 97153 | Adaptive Behavior Treatment by Protocol | Si | Si | Si |
| 97153 XP | 97153 bajo supervisión concurrente (XP) | Si | Si | Si |
| 97155 | Adaptive Behavior Treatment with Protocol Modification | - | - | Si |
| 97155 HN | 97155 con modificador HN (BCaBA) | - | Si | Si |
| 97155 XP | 97155 bajo supervisión concurrente (XP) | - | Si | Si |

> Esta configuración es por compañía y totalmente configurable.

## Notas de implementación

- Si `billingCodeIds` está vacío (`[]`) en un rol, significa que **no hay restricción** — el provider ve todos los billing codes del cliente. Esto permite backward compatibility.
- Los billing codes disponibles para seleccionar en la configuración del rol deben ser solo los que la compañía ya tiene dados de alta.
- La validación en `POST/PUT /appointment` es obligatoria como safety net, aunque el frontend ya filtre.
