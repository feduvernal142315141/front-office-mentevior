/**
 * ADDRESS TYPES
 * 
 * Types for company address management.
 * Backend response matches: { entities: [], pagination: {} }
 */

/**
 * Address entity from backend (GET response)
 * GET by ID includes countryId and stateId
 */
export interface Address {
  id: string
  city: string
  address: string
  zipCode: string
  country: string    // Country name (for display)
  state: string      // State name (for display)
  countryId?: string // Country ID (for edit)
  stateId?: string   // State ID (for edit)
}

/**
 * Address list item (same as Address from backend)
 */
export interface AddressListItem {
  id: string
  city: string
  address: string
  zipCode: string
  country: string
  state: string
}

/**
 * Create address DTO (POST payload)
 * Backend only requires: stateId, city, address, zipCode
 */
export interface CreateAddressDto {
  stateId: string
  city: string
  address: string
  zipCode: string
}

/**
 * Update address DTO (PUT payload)
 * Backend requires: id + same fields as create
 */
export interface UpdateAddressDto {
  id: string
  stateId: string
  city: string
  address: string
  zipCode: string
}

/**
 * Country catalog
 */
export interface Country {
  id: string
  name: string
}

/**
 * State catalog (filtered by country)
 */
export interface State {
  id: string
  name: string
  countryId: string
}
