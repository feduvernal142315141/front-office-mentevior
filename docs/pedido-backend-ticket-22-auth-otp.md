# Ticket #22 — Auditoría interna, login web y OTP por dispositivo

Fecha: 2026-09-21

## Puntos pendientes

### 1. Auditoría interna

Todavía no se puede ver la auditoría interna. Se necesita un módulo/endpoint para
consultar los logs de auditoría (quién hizo qué, cuándo, desde dónde).

**Pendiente backend:** definir contrato del endpoint de auditoría.

### 2. Botón de login en la página web

El botón de login en la landing page / página web pública aún no está implementado.

**Pendiente:** confirmar si es un cambio en el frontend público (landing page) o en
el front-office. Si es la landing page, es otro repositorio.

### 3. OTP cada 24 horas / dispositivo de confianza

Actualmente el OTP se pide en cada login. Se necesita que:

- Si el usuario está usando el **mismo dispositivo**, el OTP se pida cada **24 horas**
  en vez de cada login.
- O implementar un sistema de **dispositivos de confianza** donde el usuario marca
  "confiar en este dispositivo" y no se le pide OTP por un período definido.

**Propuesta de implementación:**

#### Opción A: OTP cada 24h por dispositivo

- Al verificar OTP exitosamente, backend genera un **token de dispositivo** (UUID o JWT)
  con expiración de 24h.
- Frontend guarda ese token en `localStorage` o cookie `httpOnly`.
- En el siguiente login desde el mismo dispositivo, frontend envía el token de dispositivo
  junto con las credenciales.
- Si el token es válido y no expiró, backend omite el paso de OTP.
- Si el token expiró o no existe, se pide OTP normalmente.

#### Opción B: Dispositivo de confianza

- Después del OTP exitoso, mostrar checkbox "Trust this device for 30 days".
- Si marcado, backend genera un token de confianza con expiración de 30 días.
- Mismo flujo que Opción A pero con expiración más larga.

**Endpoints sugeridos:**

```http
POST /auth/verify-otp
{
  "otp": "123456",
  "trustDevice": true
}

Response:
{
  "accessToken": "...",
  "deviceToken": "uuid-or-jwt",
  "deviceTokenExpiresAt": "2026-09-22T00:00:00Z"
}
```

```http
POST /auth/login
{
  "email": "...",
  "password": "...",
  "deviceToken": "uuid-or-jwt"  // optional
}

Response (si deviceToken válido):
{
  "accessToken": "...",
  "otpRequired": false
}

Response (sin deviceToken o expirado):
{
  "otpRequired": true
}
```

## Estado

Los 3 puntos son **pendientes de backend**. No hay cambios de frontend posibles sin
los endpoints correspondientes.
