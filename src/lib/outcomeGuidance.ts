import type { StreetAddressRecord } from './addressLookup'
import type { EvaluationResult, Responses } from './rulesEngine'

export type ReadinessLevel = 'green' | 'amber' | 'red'

export interface ReadinessStatus {
  level: ReadinessLevel
  title: string
  message: string
}

export const getReadinessStatus = (result: EvaluationResult, responses: Responses): ReadinessStatus => {
  if (responses.inCityLga === 'no') {
    return {
      level: 'red',
      title: 'May be outside City of Sydney',
      message: 'This address may be outside City of Sydney. Check the council area before you prepare documents.'
    }
  }

  if (result.pathwayKey === 'road_reallocation') {
    return {
      level: 'amber',
      title: 'Possible, but needs extra checks',
      message: 'Using a parking lane may be possible, but it usually needs extra checks and consultation.'
    }
  }

  return {
    level: 'green',
    title: 'Good to start preparing now',
    message: 'You can usually start with a simple application pack, then update details after council feedback.'
  }
}

export const getConstraintSummary = (responses: Responses, address: StreetAddressRecord): string[] => {
  const constraints = [
    `Address match source: ${address.sourceType === 'business_register' ? 'business register' : 'street register'}.`
  ]

  if (responses.locationType === 'road' || responses.locationType === 'both') {
    constraints.push('Roadside dining usually needs extra safety and traffic checks.')
  }

  if (address.specialPrecinct) {
    constraints.push(`${address.specialPrecinct} may need extra approvals from other authorities.`)
  }

  if (responses.servingAlcohol === 'yes') {
    constraints.push('Serving alcohol outside may need extra licence checks.')
  }

  if (responses.needClearanceHelp === 'yes') {
    constraints.push('Check pedestrian clearances early to avoid redesign work later.')
  }

  return constraints
}

export const getAddressSpecificChecklist = (
  result: EvaluationResult,
  responses: Responses,
  address: StreetAddressRecord
): string[] => {
  const items = [
    `Simple site plan with this address: ${address.streetAddress}, ${address.suburb}.`,
    `Proposed operating hours note for pathway (${result.pathwayLabel}).`
  ]

  if (responses.locationType === 'road' || responses.locationType === 'both') {
    items.push('Simple kerbside use sketch with sizes and access points.')
  }

  if (responses.servingAlcohol === 'yes') {
    items.push('Liquor licence details and a short outdoor alcohol note.')
  }

  if (address.specialPrecinct) {
    items.push(`Short note on approvals required for ${address.specialPrecinct}.`)
  }

  return items
}
