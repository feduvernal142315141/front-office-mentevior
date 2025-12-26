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
  const { user, isAuthenticated, login, logout } = useAuth()
  
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
- `login(email, password): Promise<boolean>` - Login function
- `logout(): void` - Logout function
- `refresh(): Promise<void>` - Manual refresh trigger

## Module Hooks

### `useLogin`
Handles user login with form state management.

**Location:** `lib/modules/auth/hooks/use-login.ts`

**Usage:**
```tsx
const { onSubmit, isSubmitting, error } = useLogin()

<form onSubmit={(e) => {
  e.preventDefault()
  onSubmit(email, password)
}}>
  {/* form fields */}
</form>
```

**Returns:**
- `onSubmit(email, password)` - Login handler with navigation
- `isSubmitting: boolean` - Loading state
- `error: string | null` - Error message

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
2. **Actions:** login, logout, refresh
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
