// Agreement types

/**
 * Agreement entity from backend
 * Structure: { name: string, content: string, createdAt: string }
 */
export interface Agreement {
  name: string
  content: string
  createdAt: string
}

/**
 * Agreement list item for table display
 */
export interface AgreementListItem {
  name: string
  content: string
  createdAt: string
}
