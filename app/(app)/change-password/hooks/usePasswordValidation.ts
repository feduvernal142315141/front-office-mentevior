export function usePasswordValidation(password: string, confirm: string) {
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const passwordsMatch = password === confirm && confirm.length > 0

  const isValid =
    hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol && passwordsMatch

  return {
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSymbol,
    passwordsMatch,
    isValid,
  }
}
