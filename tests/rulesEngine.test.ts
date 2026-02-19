import { describe, expect, it } from 'vitest'
import { evaluateEligibility, type Responses } from '../src/lib/rulesEngine'

const baseResponses: Responses = {
  hasExistingApproval: 'no',
  locationType: 'footpath',
  servingAlcohol: 'no',
  inCityLga: 'yes',
  inSpecialPrecinct: 'no',
  needClearanceHelp: 'no'
}

describe('evaluateEligibility', () => {
  it('defaults to new application for new applicants in LGA', () => {
    const result = evaluateEligibility(baseResponses)
    expect(result.pathwayKey).toBe('new_application')
    expect(result.matchedRuleId).toBe('new_application_default')
  })

  it('returns road reallocation for road-based new applications', () => {
    const result = evaluateEligibility({ ...baseResponses, locationType: 'road' })
    expect(result.pathwayKey).toBe('road_reallocation')
    expect(result.matchedRuleId).toBe('road_reallocation_new')
  })

  it('prioritises outside LGA warning', () => {
    const result = evaluateEligibility({ ...baseResponses, inCityLga: 'no', locationType: 'road' })
    expect(result.matchedRuleId).toBe('outside_lga')
  })

  it('routes existing approvals to council referral pathway', () => {
    const result = evaluateEligibility({ ...baseResponses, hasExistingApproval: 'yes' })
    expect(result.pathwayKey).toBe('contact_council_existing')
  })
})
