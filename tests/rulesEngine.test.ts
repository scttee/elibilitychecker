import { describe, expect, it } from 'vitest'
import { evaluateEligibility, type Responses } from '../src/lib/rulesEngine'

const baseResponses: Responses = {
  hasExistingApproval: 'no',
  locationType: 'footpath',
  operatorChangeOnly: 'no',
  changingLayoutOrArea: 'no',
  changingHours: 'no',
  servingAlcohol: 'no',
  inCityLga: 'yes',
  inSpecialPrecinct: 'no',
  needClearanceHelp: 'no'
}

describe('evaluateEligibility', () => {
  it('returns renew pathway when existing permit has no changes', () => {
    const result = evaluateEligibility({
      ...baseResponses,
      hasExistingApproval: 'yes'
    })

    expect(result.pathwayKey).toBe('renew_no_changes')
    expect(result.matchedRuleId).toBe('renew_unchanged')
  })

  it('prioritises outside LGA warning', () => {
    const result = evaluateEligibility({
      ...baseResponses,
      inCityLga: 'no',
      locationType: 'road'
    })

    expect(result.matchedRuleId).toBe('outside_lga')
    expect(result.warnings.join(' ')).toContain('outside City of Sydney')
  })

  it('uses road pathway for road or both', () => {
    const result = evaluateEligibility({
      ...baseResponses,
      locationType: 'both'
    })

    expect(result.pathwayKey).toBe('road_reallocation')
    expect(result.checklist.join(' ')).toContain('parking lane')
  })
})
