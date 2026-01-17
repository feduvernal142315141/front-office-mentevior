
const COMPANY_IDENTIFIER_KEY = "mv-company-identifier";


export function setCompanyIdentifier(identifier: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(COMPANY_IDENTIFIER_KEY, identifier);
  }
}


export function getCompanyIdentifier(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(COMPANY_IDENTIFIER_KEY);
  }
  return null;
}


export function clearCompanyIdentifier(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(COMPANY_IDENTIFIER_KEY);
  }
}


export function getLoginUrl(): string {
  const identifier = getCompanyIdentifier();
  if (identifier) {
    return `/${identifier}/login`;
  }

  return "/login-error";
}


export function getCompanyUrl(path: string): string {
  const identifier = getCompanyIdentifier();
  if (identifier) {
    return `/${identifier}${path}`;
  }
  return path;
}
