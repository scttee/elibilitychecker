import { describe, expect, it } from 'vitest'
import { getAddressSpecificChecklist, getConstraintSummary, getReadinessStatus } from '../src/lib/outcomeGuidance'
import type { StreetAddressRecord } from '../src/lib/addressLookup'
import type { EvaluationResult, Responses } from '../src/lib/rulesEngine'

const address: StreetAddressRecord = {
  id: 'sydney-george',
  streetAddress: 'George Street',
  suburb: 'Sydney',
  postcode: '2000',
  inCityLga: true,
  specialPrecinct: null,
  footpathZone: 'city_centre',
  sourceType: 'street_register'
}

const responses: Responses = {
  hasExistingApproval: 'no',
  locationType: 'footpath',
  servingAlcohol: 'no',
  inCityLga: 'yes',
  inSpecialPrecinct: 'no',
  needClearanceHelp: 'no'
}

const result: EvaluationResult = {
  pathwayKey: 'new_application',
  pathwayLabel: 'New outdoor dining application',
  checklist: [],
  notNeededYet: [],
  warnings: [],
  nextSteps: [],
  matchedRuleId: 'new_application_default'
}

describe('outcome guidance helpers', () => {
  it('returns amber for road reallocation', () => {
    const status = getReadinessStatus({ ...result, pathwayKey: 'road_reallocation' }, { ...responses, locationType: 'road' })
    expect(status.level).toBe('amber')
  })

  it('adds road constraint and alcohol constraint when relevant', () => {
    const constraints = getConstraintSummary({ ...responses, locationType: 'both', servingAlcohol: 'yes' }, address)
    expect(constraints.join(' ')).toContain('road safety')
    expect(constraints.join(' ')).toContain('Alcohol')
  })

  it('builds address-specific checklist items', () => {
    const items = getAddressSpecificChecklist(result, responses, address)
    expect(items[0]).toContain('George Street')
  })
})
