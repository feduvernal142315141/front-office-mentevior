# Auth Module

Authentication and authorization module for MenteVior Front Office.

## Architecture

**State Management:** Zustand (Single Source of Truth)  
**Location:** `lib/store/auth.store.ts`  
**Persistence:** localStorage + server cookies  
**Auto-refresh:** Web Worker (background thread)

## Main Hook

### `useAuth`
Primary hook for authentication. Wrapper over Zustand store.

**Location:** `lib/hooks/use-auth.tsx`

**Usage:**
```tsx
import { useAuth } from "@/lib/hooks/use-auth"

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth()
  
  if (!isAuthenticated) {
    return <LoginButton />
  }
  
  return <div>Welcome {user.name}</div>
}
```

**Returns:**
- `user: User | null` - Current authenticated user
- `token: string | null` - Access token
- `refreshToken: string | null` - Refresh token
- `isAuthenticated: boolean` - Auth status
- `hydrated: boolean` - Store hydration status
- `logout(): void` - Logout function
- `refresh(): Promise<void>` - Manual refresh trigger

Signing in does **not** go through `useAuth`: it is a multi-step flow, see `useLoginFlow`.

## Login flow

Every login is two steps, because the backend validates credentials and emails a
one-time code before issuing any token. There are two variants, decided by the
subdomain the user lands on.

**Company subdomain** (`acme.frontoffice…`):

```
POST /member-users/auth/login          → OTP challenge (code sent by email)
POST /member-users/auth/resend-otp     → a new OTP challenge, replacing the previous one
POST /member-users/auth/validate-otp   → tokens
```

**Neutral login** (`app.frontoffice…`, where the landing page sends users who don't
know their organization's URL):

```
POST /member-users/auth/global-login         → OTP challenge (code sent by email)
POST /member-users/auth/resend-otp-global    → a new OTP challenge, replacing the previous one
POST /member-users/auth/validate-otp-global  → tokens if a single company matched,
                                               otherwise the list of companies
POST /member-users/auth/company-login        → tokens, for the company the user picked
```

Every step after the credentials carries the `otpChallengeId` that identifies the
attempt. The challenge also states how long the code is, when it expires and how
long to wait before resending, so the UI never hardcodes those numbers. A resend
issues a **new** id and invalidates the old one, so always send the latest.

### `useLoginFlow`
Drives the three steps: credentials → verification code → organization picker.

**Location:** `lib/modules/auth/hooks/use-login-flow.ts`

```tsx
const {
  step,            // "credentials" | "otp" | "company"
  companies,       // organizations to choose from, when the email matched several
  challenge,       // current OTP challenge: id, length, expiry, resend cooldown
  attemptsLeft,    // tries left before the backend invalidates the code
  error, notice, isSubmitting, isNeutral,
  submitCredentials, submitOtp, resendCode, selectCompany, backToCredentials,
} = useLoginFlow({ company })
```

Pass `company: null` for the neutral login and the resolved `CompanyInfo` when the
subdomain already identifies an organization.

The password is kept **in memory only** for the duration of the flow, because
`company-login` requires it again. Reloading the page mid-flow loses it and returns
the user to the first step.

`attemptsLeft` is counted on the client, since the backend doesn't report it. Only
rejected responses count: a network failure never reached the server, so it doesn't
consume an attempt (`AuthAttempt` distinguishes the two through `kind`).

### Cross-subdomain handoff

The neutral login runs on `app.frontoffice…` but the session must live on
`{slug}.frontoffice…`, a different origin: neither the persisted store (localStorage)
nor the `mv_fo_token` cookie crosses over. Tokens therefore travel in the URL
**fragment** to `/session-handoff` on the target subdomain, which opens the session
there and strips the fragment immediately. See `lib/modules/auth/session-handoff.ts`.

The destination is always rebuilt from a validated slug plus a known base domain
(`buildCompanyOrigin`), never from a URL supplied by the backend.

### `useLogout`
Handles user logout with navigation.

**Location:** `lib/modules/auth/hooks/use-logout.ts`

**Usage:**
```tsx
const { logout } = useLogout()

<button onClick={logout}>Logout</button>
```

**Returns:**
- `logout()` - Clears session and redirects to /login

## Store Architecture

The auth store (`lib/store/auth.store.ts`) manages:

1. **User State:** User info, tokens, expiration times
2. **Actions:** the five login steps (`requestLoginOtp`, `verifyLoginOtp`,
   `requestGlobalOtp`, `verifyGlobalOtp`, `loginToCompany`), plus `establishSession`,
   `logout` and `refresh`. Every path that ends with tokens funnels through the same
   internal `openSession`, so the session is always assembled the same way.
3. **Worker Management:** initWorker, stopWorker, clearWorker
4. **Persistence:** Auto-save to localStorage via Zustand middleware
5. **Hydration:** Restore state on app load with validation

### Refresh Token Flow

```
User logs in
    ↓
Store saves tokens + expiration
    ↓
Worker starts checking every 5s
    ↓
Token expires in <30s?
    ↓
Worker triggers refresh
    ↓
New tokens saved
    ↓
Worker restarts with new times
```

## Types

**Location:** `lib/types/auth.types.ts`

```typescript
interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  expiresAt: string
}

interface TokenState {
  accessToken: string | null
  accessTokenExpiresAt: number
  refreshToken: string | null
  refreshTokenExpiresAt: number
}
```

## Navigation Flow

- **Login Success** → `router.replace("/dashboard")` 
- **Logout** → `router.replace("/login")`
- **Session Expired** → Auto-logout + redirect to /login
- **Protected Routes** → Server checks cookies in middleware

## Best Practices

1. ✅ Always use `useAuth` hook, never access store directly
2. ✅ Worker management is automatic, don't call `initWorker()` manually
3. ✅ Tokens are in the store, don't read from localStorage
4. ✅ Use `isAuthenticated` to guard routes, don't check token manually
5. ❌ Never use deprecated `useSession` from old session.store.ts
