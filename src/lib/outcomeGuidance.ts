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
      title: 'Likely outside scope',
      message: 'This address looks outside City of Sydney. Confirm the right council before preparing an application.'
    }
  }

  if (result.pathwayKey === 'road_reallocation') {
    return {
      level: 'amber',
      title: 'Likely possible with extra review',
      message: 'Road reallocation may be possible, but usually needs extra technical review and consultation.'
    }
  }

  return {
    level: 'green',
    title: 'Likely straightforward to proceed',
    message: 'You can likely prepare a standard new-application package now and refine details with council feedback.'
  }
}

export const getConstraintSummary = (responses: Responses, address: StreetAddressRecord): string[] => {
  const constraints = [
    `Address certainty: matched from ${address.sourceType === 'business_register' ? 'business register' : 'street register'}.`
  ]

  if (responses.locationType === 'road' || responses.locationType === 'both') {
    constraints.push('On-street dining usually requires road safety and traffic impact consideration.')
  }

  if (address.specialPrecinct) {
    constraints.push(`${address.specialPrecinct} may involve additional authority pathways and approvals.`)
  }

  if (responses.servingAlcohol === 'yes') {
    constraints.push('Alcohol service outdoors may require additional licensing alignment.')
  }

  if (responses.needClearanceHelp === 'yes') {
    constraints.push('Pedestrian clearance checks should be validated early with council guidance.')
  }

  return constraints
}

export const getAddressSpecificChecklist = (
  result: EvaluationResult,
  responses: Responses,
  address: StreetAddressRecord
): string[] => {
  const items = [
    `Site plan labelled with selected address: ${address.streetAddress}, ${address.suburb}.`,
    `Operating hours statement aligned to likely pathway (${result.pathwayLabel}).`
  ]

  if (responses.locationType === 'road' || responses.locationType === 'both') {
    items.push('Road occupancy concept with kerbside dimensions and access points.')
  }

  if (responses.servingAlcohol === 'yes') {
    items.push('Liquor licence details and an outdoor alcohol management note.')
  }

  if (address.specialPrecinct) {
    items.push(`Authority coordination note for ${address.specialPrecinct}.`)
  }

  return items
}
