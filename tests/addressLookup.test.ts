import { describe, expect, it } from 'vitest'
import { estimateEntitlement, getCityLgaCoverage, searchStreetAddresses } from '../src/lib/addressLookup'

describe('searchStreetAddresses', () => {
  it('supports any street when suburb is in City of Sydney', () => {
    const [result] = searchStreetAddresses('999 Imaginary Street, Haymarket')
    expect(result.streetAddress).toBe('999 Imaginary Street')
    expect(result.suburb).toBe('Haymarket')
  })

  it('matches by suburb-only queries', () => {
    const results = searchStreetAddresses('Barangaroo')
    expect(results.some((item) => item.suburb === 'Barangaroo')).toBe(true)
  })

  it('returns entitlement guidance for a selected record', () => {
    const [record] = searchStreetAddresses('1 Test Road, Sydney')
    const entitlement = estimateEntitlement(record)
    expect(entitlement.likelyMaxAreaSqm).toBeGreaterThan(0)
    expect(entitlement.likelyHours.length).toBeGreaterThan(0)
  })

  it('covers all configured City of Sydney suburbs', () => {
    const coverage = getCityLgaCoverage()
    expect(coverage.suburbCount).toBeGreaterThan(30)
    expect(coverage.coverageNote).toContain('any street')
  })
})
