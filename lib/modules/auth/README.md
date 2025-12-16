# Auth Module

Authentication and authorization module for MenteVior Back Office.

## Hooks

### `useLogin`
Handles user login logic, authentication, and navigation to dashboard.

**Usage:**
\`\`\`tsx
const { handleLogin, isLoading, error } = useLogin()

const onSubmit = async (email: string, password: string) => {
  await handleLogin(email, password)
}
\`\`\`

**Returns:**
- `handleLogin(email, password)` - Login function that handles authentication and navigation
- `isLoading` - Boolean indicating login in progress
- `error` - Error message string if login fails

### `useLogout`
Handles user logout, clears auth state, and navigates to login.

**Usage:**
\`\`\`tsx
const { logout } = useLogout()

<button onClick={logout}>Logout</button>
\`\`\`

**Returns:**
- `logout()` - Function that clears session and redirects to login

## Architecture

All authentication logic is centralized in dedicated hooks to:
- Separate concerns (UI vs business logic)
- Enable reusability across components
- Maintain consistent navigation patterns using Next.js router
- Avoid anti-patterns like `window.location`

## Navigation Flow

- **Login Success** → `router.replace("/")` - Prevents back navigation to login
- **Logout** → `router.replace("/login")` - Clears state and redirects
- **Protected Routes** → Handled by middleware checking cookies
