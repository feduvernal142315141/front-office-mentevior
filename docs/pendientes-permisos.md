# Pendientes de permisos — próximas iteraciones

Fecha: 2026-09-03

## 1. Botón Block de Session Notes gateado por `appointment`

`app/(app)/session-note/page.tsx` usa `canBlock(PermissionModule.APPOINTMENT)` en 3 sitios
para mostrar el botón **Block**. Desde que Session / Service Plan Events / Supervision son
módulos **solo-Edit** en la matriz de roles (`EDIT_ONLY_MODULES` en
`components/form/PermissionsSelector.tsx`), ningún rol nuevo o re-guardado puede tener el
bit Block en `appointment`, así que ese botón irá desapareciendo a medida que los admins
editen roles.

**Decisión pendiente:** mover el gating del Block a otro permiso (candidato natural:
Block de `session_note`) o eliminar el botón.

## 2. Renombre de permisos de configuración (backend 2026-09-03)

El backend renombró en el catálogo global:

- `service_plan` → `service_plan_config`
- `appointment` → `session_config`
- `supervision` → `supervision_config`

El front sigue usando los slugs viejos como canónicos. Plan cuando se confirme con backend:

1. `permissions-map.ts`: renombrar las tres claves (mismos UUIDs si se conservan; si
   cambian, los viejos van a `LEGACY_PERMISSION_ID_TO_MODULE`) y agregar aliases
   `appointment` → `session_config`, etc. en `PERMISSION_MODULE_ALIASES` para JWTs vivos.
2. `permissions-new.ts`: renombrar miembros del enum (`APPOINTMENT` → `SESSION_CONFIG`…).
3. Actualizar usos: `route-permissions.ts`, `PermissionsSelector`, `events/page.tsx` (×2),
   los `EditGate` de los tres config forms y los `canBlock` de session-note (ver punto 1).

**Preguntas abiertas con backend:**
- ¿Los `permissionId` (UUID) se conservan o la migración crea registros nuevos?
- ¿El claim `permissions` del JWT se construye con UUID o con nombre?

## 3. `client_service_plan` — gating del front

El permiso ya existe en el catálogo del backend y en la matriz de roles del front, pero
las pantallas de client service plan (`/clients/[id]/service-plan`, CategoriesSidebar,
CategoryItemsPanel, ServicePlanContent…) siguen gateadas por `clients`.

**Pendiente:** cuando backend confirme qué endpoints exigen `client_service_plan`,
cambiar el gating de esas pantallas al módulo nuevo (`PermissionModule.CLIENT_SERVICE_PLAN`)
y mapear la ruta en `route-permissions.ts`.
