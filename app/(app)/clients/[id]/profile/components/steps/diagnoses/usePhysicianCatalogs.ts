"use client"

import { useMemo } from "react"

import { useCountries } from "@/lib/modules/addresses/hooks/use-countries"
import { useStates } from "@/lib/modules/addresses/hooks/use-states"
import { usePhysicianTypes } from "@/lib/modules/physicians/hooks/use-physician-types"
import { usePhysicianSpecialties } from "@/lib/modules/physicians/hooks/use-physician-specialties"

/**
 * Catálogos que necesitan los formularios de physician. Van juntos y gateados por
 * `enabled` porque sólo hacen falta dentro de los modales anidados: antes se pedían
 * los cuatro al entrar al paso de Diagnoses aunque no se abriera ninguno.
 */
export function usePhysicianCatalogs(enabled: boolean) {
  const { countries, isLoading: isLoadingCountries } = useCountries({ enabled })
  const { physicianTypes, isLoading: isLoadingPhysicianTypes } = usePhysicianTypes({ enabled })
  const { physicianSpecialties, isLoading: isLoadingPhysicianSpecialties } = usePhysicianSpecialties({ enabled })

  const usaCountry = useMemo(
    () => countries.find((country) => country.name === "United States" || country.name === "USA"),
    [countries]
  )

  const { states, isLoading: isLoadingStates } = useStates(enabled ? usaCountry?.id ?? null : null)

  const countryOptions = useMemo(
    () => countries.map((country) => ({ id: country.id, name: country.name })),
    [countries]
  )

  const stateOptions = useMemo(
    () => states.map((state) => ({ id: state.id, name: state.name })),
    [states]
  )

  return {
    countries: countryOptions,
    states: stateOptions,
    physicianTypes,
    physicianSpecialties,
    usaCountry,
    isLoadingCountries,
    isLoadingStates,
    isLoadingPhysicianTypes,
    isLoadingPhysicianSpecialties,
  }
}
