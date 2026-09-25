# Menú "Session" no aparece en Company Configuration — Diagnóstico

Fecha: 2026-09-24

## Problema

El item **"Session"** no aparece en el menú lateral de Company Configuration, ni
siquiera para usuarios SuperAdmin.

## Diagnóstico frontend

El frontend tiene todo configurado correctamente:

| Elemento | Valor | Estado |
|----------|-------|--------|
| Nav item | `{ label: "Session", href: "/my-company/session" }` | Existe en `nav-items.ts` |
| Ruta → Permiso | `/my-company/session` → `PermissionModule.APPOINTMENT` | Mapeado en `route-permissions.ts` |
| Página | `app/(app)/my-company/session/page.tsx` | Existe |
| Hidden modules | `/my-company/session` | **No** está oculto |

## Lógica de visibilidad

El menú lateral filtra items con `useFilteredNavItems()`:

```
permissionsObj[APPOINTMENT] > 0 → muestra "Session"
permissionsObj[APPOINTMENT] === 0 → oculta "Session"
```

Si no aparece, significa que `user.permissions` no incluye el módulo `appointment`
con ningún bit de acción (READ/CREATE/EDIT/DELETE/BLOCK).

## Causa probable

El rol **SuperAdmin** en backend no tiene el módulo `appointment` en su lista de
permisos, o el endpoint de login/token no lo incluye en la respuesta.

## Acción requerida (backend)

Verificar que el rol SuperAdmin (y cualquier rol que deba ver la configuración de
sesiones) tenga el módulo `appointment` con al menos una acción habilitada.

Tabla: `role_permission` (o equivalente)
- `module_id` = UUID del módulo `appointment`
- Al menos `read = true` o `edit = true`

## Nota

El módulo `appointment` controla dos rutas:
- `/my-company/session` — Configuración de sesiones (Company Config)
- `/my-company/events/appointment` — Eventos de appointment

El frontend usa el mismo `PermissionModule.APPOINTMENT` para ambas.
