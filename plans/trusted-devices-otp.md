# Frontend: Dispositivos de Confianza para OTP - Plan de Implementación

**Fecha**: 2026-09-26
**Estado**: Análisis completado, listo para implementación
**Rama**: `feature/trusted-devices-otp` (creada)

---

## 📋 Resumen Ejecutivo

Se requiere agregar soporte para que los usuarios puedan recordar su dispositivo por 24 horas durante la validación de OTP. Los cambios abarcan:
- Agregar checkbox "Recordar este dispositivo" en pantalla OTP (inicialmente desmarcado)
- Enviar flag `rememberDevice` al validar OTP
- Configurar axios para enviar credenciales (cookies) en endpoints de auth
- Interpretar `otpRequired` en respuestas de login para detectar cuando se saltea OTP
- Manejar CSRF solo si el entorno lo requiere

**Impacto en código:**
- 6 archivos principales a modificar
- 2-3 nuevos tipos/interfaces
- ~150-200 líneas de código nuevo
- Totalmente backward-compatible

---

## 🏗️ Arquitectura Actual

```
┌─────────────────────────────────────┐
│   OtpStep (UI Component)            │
│   - Renders OTP input               │
│   - Passes code to hook             │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   useLoginFlow (Hook)               │
│   - Orchestrates login steps        │
│   - Manages email, password, code   │
│   - Calls store methods             │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   useAuthStore (Zustand)            │
│   - verifyLoginOtp()                │
│   - verifyGlobalOtp()               │
│   - Decodes tokens, opens session   │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   serviceValidateOtp()              │
│   - Calls axios with request DTO    │
│   - Returns response                │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   apiConfig (axios instance)        │
│   - Adds Authorization header       │
│   - Handles 401 retry               │
└──────────────────────────────────────┘
```

**Punto de integración para dispositivos confiables**: Entre Hook y Store (pass `rememberDevice`), y en Store → Service (include flag in request DTO).

---

## 📊 6 Fases de Implementación

### FASE 1: Tipos & Configuración API

**Archivos**:
- `/lib/models/login/login.ts` (actualizar tipos de request)
- `/lib/services/apiConfig.ts` (habilitar credentials)

**Cambios concretos**:
1. En `ValidateOtpRequest`: agregar `rememberDevice?: boolean`
2. En `ValidateOtpGlobalRequest`: agregar `rememberDevice?: boolean`
3. En `apiConfig.ts`: Agregar `withCredentials: true` para rutas PUBLIC_AUTH_ROUTES
4. (Opcional) En `apiConfig.ts`: Agregar soporte para CSRF header si `NEXT_PUBLIC_CSRF_REQUIRED=true`

**Por qué**:
- Los tipos definen el contrato con el backend
- Axios necesita saber que envíe cookies en auth endpoints
- Esto es prerrequisito para que el backend acepte la cookie de dispositivo confiable

**Riesgo**: Bajo. Los tipos son opcionales (`rememberDevice?: boolean`), así que no rompen requests actuales.

---

### FASE 2: Store & Hook

**Archivos**:
- `/lib/store/auth.store.ts` (actualizar verifyLoginOtp, verifyGlobalOtp)
- `/lib/modules/auth/hooks/use-login-flow.ts` (agregar estado rememberDevice)

**Cambios concretos**:

En `auth.store.ts`:
```typescript
verifyLoginOtp: async (
  email, otpCode, company, otpChallengeId,
  rememberDevice: boolean = false  // ← agregar parámetro
)
```
Incluir `rememberDevice` en el payload que se envía a `serviceValidateOtp()`.

En `use-login-flow.ts`:
```typescript
const [rememberDevice, setRememberDevice] = useState(false)
```
Pasar `rememberDevice` a `verifyLoginOtp()` en `submitOtp()`.

**Por qué**: El flag de dispositivo vive en el hook durante la pantalla OTP. El store lo reenvía al backend.

---

### FASE 3: Servicios API

**Archivos**: `/lib/services/login/login.ts`

**Cambios**: NINGUNO - Los servicios ya son genéricos y reutilizan los tipos de Phase 1. Una vez que los tipos tengan `rememberDevice`, los servicios automáticamente lo incluyen en la request.

**Ventaja**: No hay que tocar la capa de servicios. Clean separation of concerns.

---

### FASE 4: Componentes UI

**Archivos**:
- `/app/(auth)/login/OtpStep.tsx` (agregar checkbox)
- `/app/(auth)/login/LoginForm.tsx` (pasar estado al OtpStep)

**Cambios concretos**:

En `OtpStep.tsx`:
- Agregar props: `rememberDevice: boolean`, `onRememberDeviceChange: (value: boolean) => void`
- Render checkbox antes del botón "Verify and continue"
- Label: "Remember this device for 24 hours"
- Por ahora, el checkbox siempre se muestra (el spec dice "hidden until activation", pero eso es feature flag del backend; mostramos el checkbox y el backend decide si usarlo)

En `LoginForm.tsx`:
- State: `const [rememberDevice, setRememberDevice] = useState(false)`
- Props a OtpStep: `rememberDevice={rememberDevice}` y `onRememberDeviceChange={setRememberDevice}`
- En `backToCredentials()`: resetear a `setRememberDevice(false)`

**Estilos**: Usar componentes existentes; si hay un Checkbox component reutilizar, sino usar `<input type="checkbox">`

---

### FASE 5: Casos Edge & Multi-Empresa

**Archivo**: `/lib/store/auth.store.ts`

**Cambios concretos**:

1. **En `requestLoginOtp`**: Interpretar `otpRequired` en la respuesta
   - Si `response.data.otpRequired === false` y hay tokens → abrir sesión sin pasar por OTP
   - Si `otpRequired === true` → flujo normal, mostrar pantalla OTP
   - Fallback: si `otpRequired` no viene, asumir `true` (backward compatible)

2. **En `requestGlobalOtp`**: Mismo trato para `otpRequired`

3. **En `verifyGlobalOtp`**: Verificar si se necesita selección de compañía sin OTP
   - Si `companies.length > 1` y `tokens === null` → pasar a selección
   - Si `companies.length > 1` y `tokens !== null` → tokens + selección = permitir elegir compañía sin OTP nuevo

**Por qué**: Con dispositivo confiable, el usuario puede no necesitar OTP en login ni en company-login. El frontend necesita reconocer eso.

---

### FASE 6: CSRF (Solo si es necesario)

**Archivos**: `/lib/modules/auth/hooks/use-login-flow.ts`, `/lib/services/login/login.ts`

**Cambios concretos**:

1. En `use-login-flow.ts`, antes de `submitCredentials()`:
   ```typescript
   if (process.env.NEXT_PUBLIC_CSRF_REQUIRED === 'true') {
     const csrfResponse = await fetch(`${API_BASE}/csrf`, {
       credentials: 'include'
     })
     const csrf = await csrfResponse.json()
     // Guardar en ref: csrfTokenRef.current = csrf.token
   }
   ```

2. En `apiConfig.ts`, al detectar PUBLIC_AUTH_ROUTES:
   ```typescript
   if (process.env.NEXT_PUBLIC_CSRF_REQUIRED === 'true' && csrfToken) {
     config.headers['X-CSRF-TOKEN'] = csrfToken
   }
   ```

3. Crear servicio en `login.ts`:
   ```typescript
   export const serviceGetCsrfToken = async () =>
     serviceGetSilent<{ token: string }>('/csrf')
   ```

**Nota**: La mayoría de entornos no necesitarán CSRF. Implementar solo si backend lo requiere.

---

## ⚡ Decisiones Arquitectónicas Clave

| Decisión | Opción Elegida | Rationale |
|----------|---|---|
| **Visibilidad checkbox** | Siempre visible, sin restricciones | Simplifica UX. Backend decide si usa o ignora el flag. |
| **Persistencia rememberDevice** | Transient (solo en memoria durante login) | El usuario decide cada login. No guardar en localStorage. |
| **otpRequired fallback** | Asumir `true` si falta el campo | Backward-compatible con backends antiguos. |
| **Scope de credentials** | Solo PUBLIC_AUTH_ROUTES | Evita enviar cookies a endpoints no-auth. |
| **CSRF** | Basado en env var `NEXT_PUBLIC_CSRF_REQUIRED` | Optional, configurado por entorno. |
| **Manejo de challenge expirado** | Reiniciar login completo | Backend rechaza challenge viejo; frontend redirige a credenciales. |

---

## 📁 Archivos Clave a Modificar

```
lib/
├── models/login/login.ts                    ← Agregar rememberDevice a tipos
├── services/
│   ├── apiConfig.ts                         ← Habilitar withCredentials
│   └── login/login.ts                       ← (sin cambios, o agregar serviceGetCsrfToken)
└── store/auth.store.ts                      ← Actualizar verifyLoginOtp(…rememberDevice)
    └── modules/auth/hooks/use-login-flow.ts ← Agregar estado rememberDevice

app/(auth)/login/
├── OtpStep.tsx                              ← Agregar checkbox UI
└── LoginForm.tsx                            ← Pasar rememberDevice al OtpStep
```

---

## 🧪 Testing Checklist

- [ ] Checkbox renderea en pantalla OTP
- [ ] Al marcar checkbox, se envía `rememberDevice: true` en request
- [ ] Al desmarcar, se envía `false` (no `undefined`)
- [ ] Resend OTP limpia el checkbox (vuelve a `false`)
- [ ] Sin marcar checkbox, flujo de login funciona normal
- [ ] Con `otpRequired: false` en respuesta de login, se salta pantalla OTP
- [ ] Con multiple companías, se muestra selección después de validar OTP
- [ ] CSRF header se incluye en auth requests (si `NEXT_PUBLIC_CSRF_REQUIRED=true`)
- [ ] Todas las rutas no-auth siguen funcionando sin cambios

---

## ✅ Orden de Implementación Recomendado

1. **Phase 1** → Phase 2 → Phase 4 (tipos, store, UI básica)
2. Probar localmente: checkbox renderea, marca/desmarca
3. **Phase 5** (edge cases con otpRequired)
4. **Phase 6** (CSRF, solo si se requiere)
5. Probar contra backend con TRUSTED_DEVICE_ENABLED=true
6. Crear PR para revisión

**Tiempo estimado**: 3-4 horas de codificación + 1-2 horas testing

---

## 🚀 Próximos Pasos

1. ✅ Análisis completado (este documento)
2. ⏳ Implementar Phase 1-4 (tipos, store, hook, UI)
3. ⏳ Probar localmente con backend mock
4. ⏳ Implementar Phase 5-6 (edge cases, CSRF)
5. ⏳ Testing completo
6. ⏳ Revisar con backend team
7. ⏳ Crear PR

---

## 📝 Notas Importantes

- **Secretos NO se exponen**: Password sigue con RSA, OTP nunca en localStorage
- **Backward compatible**: Campos opcionales, fallbacks para APIs viejas
- **Feature flag del backend**: El backend controla si usa la cookie confiable; frontend solo envía el flag
- **Logout conserva confianza**: User puede logout pero la cookie confiable queda (por 24h)
- **Reset/bloqueo revoca**: Si user cambia password o se bloquea la cuenta, confianza se pierde
